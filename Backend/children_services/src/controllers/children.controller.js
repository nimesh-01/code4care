const axios = require('axios');
const Child = require('../models/child.model');
const { uploadBuffer, deleteFile } = require('../services/imagekit.service');

// Helper: resolve orphanage id for the current user by checking token then auth service
const normalizeOrphanageId = (value) => {
    if (!value) return null;
    if (typeof value === 'string') return value;
    if (value._id) return value._id.toString();
    if (value.id) return value.id.toString();
    try {
        return value.toString();
    } catch (err) {
        return null;
    }
};

const isOrphanAdmin = (user) => {
    if (!user) return false;
    const role = (user.role || user.type || '').toString().trim().toLowerCase();
    if (role === 'orphanadmin') return true;
    // Token may omit role but still carry an orphanageId for orphan admins
    if (user.orphanageId || user.orphanage) return true;
    // Some tokens include permissions array
    if (Array.isArray(user.permissions)) {
        return user.permissions.some((perm) => perm.toString().toLowerCase().includes('orphan'));
    }
    return false;
};

const resolveOrphanageId = async (req) => {
    try {
        const authUrl = process.env.AUTH_SERVICE_URL || 'http://localhost:3000/auth/orphanage';
        const headers = {};
        if (req.headers?.cookie) headers['Cookie'] = req.headers.cookie;
        if (req.headers?.authorization) headers['Authorization'] = req.headers.authorization;
        const resp = await axios.get(authUrl, { headers, withCredentials: true });
        const orphanageId = resp?.data?.orphanage?._id || resp?.data?.orphanage?.id;
        if (orphanageId) return orphanageId.toString();
    } catch (e) {
        console.warn('Could not fetch orphanage from auth service:', e.message);
    }
    return null;
};

const getRequestOrphanageId = async (req) => {
    const fromUser = normalizeOrphanageId(req.user?.orphanageId || req.user?.orphanage);
    if (fromUser) return fromUser;
    return await resolveOrphanageId(req);
};
const createChild = async (req, res) => {
    // track uploads so catch() can clean them up
    let uploadedDocs = [];
    let uploadedImageFileId;
    let createdChild = null;

    try {
        // Debug logging
        console.log('🔍 createChild - req.user:', JSON.stringify(req.user, null, 2));
        
        // allow only orphanAdmin
        const role = req.user?.role || req.user?.type;
        console.log('🔍 createChild - extracted role:', role);
        
        if (!isOrphanAdmin(req.user)) {
            return res.status(403).json({ success: false, message: 'Forbidden - orphanAdmin only' });
        }

        const payload = { ...req.body };
        payload.createdBy = req.user._id || req.user.id || req.user.userId;

        // orphanageId from logged-in user (preferred)
        const orphanageId = await getRequestOrphanageId(req);
        if (!orphanageId) {
            return res.status(400).json({ success: false, message: 'Orphanage not linked with this admin' });
        }
        payload.orphanageId = orphanageId;
        if (!payload.orphanageId) {
            return res.status(400).json({ success: false, message: 'Orphanage not linked with this admin' });
        }

        // create minimal child first to get stable _id for uploads
        const minimal = { ...payload };
        delete minimal.profileUrl;
        delete minimal.profileFileId;
        delete minimal.documents;

        createdChild = await Child.create(minimal);
        const childId = createdChild._id;

        // IMAGE UPLOAD -> children/<childId>/images
        if (req.files?.image?.[0]) {
            const file = req.files.image[0];
            const folder = `children/${childId}/images`;
            const result = await uploadBuffer(file.buffer, file.originalname, folder, file.mimetype);
            uploadedImageFileId = result.fileId || result.file_id;
            createdChild.profileUrl = result.url;
            createdChild.profileFileId = uploadedImageFileId;
        }

        // DOCUMENT UPLOAD -> children/<childId>/documents
        if (req.files?.documents?.length) {
            const folder = `children/${childId}/documents`;
            for (const file of req.files.documents) {
                const result = await uploadBuffer(file.buffer, file.originalname, folder, file.mimetype);
                const doc = { url: result.url, fileId: result.fileId || result.file_id, name: file.originalname };
                uploadedDocs.push(doc);
            }
            createdChild.documents = uploadedDocs;
        }

        // persist uploaded file info
        await createdChild.save();

        return res.status(201).json({ success: true, data: createdChild });
    } catch (err) {
        // cleanup on failure: delete uploaded files and the created child record
        try {
            if (uploadedImageFileId) await deleteFile(uploadedImageFileId);
            if (uploadedDocs && uploadedDocs.length) {
                for (const d of uploadedDocs) {
                    if (d.fileId) await deleteFile(d.fileId);
                }
            }
            if (createdChild) await Child.findByIdAndDelete(createdChild._id);
        } catch (cleanupErr) {
            console.error('createChild cleanup error:', cleanupErr.message || cleanupErr);
        }

        console.error('createChild error:', err.stack || err);
        return res.status(400).json({ success: false, message: err.message });
    }
};

const getChildren = async (req, res) => {
    try {
        // If logged in as orphanAdmin -> return children of that orphanage
        const role = req.user?.role || req.user?.type;
        if (isOrphanAdmin(req.user)) {
            const orphanageId = await getRequestOrphanageId(req);
            if (!orphanageId) return res.status(400).json({ success: false, message: 'Orphanage not linked with this admin' });

            const children = await Child.find({ orphanageId }).limit(500);
            return res.json(children);
        }

        // Public / regular users / volunteers: allow filters via query params
        const { state, city, limit = 100, page = 1 } = req.query;
        const query = {};
        if (state) query['address.state'] = { $regex: `^${state}$`, $options: 'i' };
        if (city) query['address.city'] = { $regex: `^${city}$`, $options: 'i' };

        const perPage = Math.min(parseInt(limit, 10) || 100, 500);
        const skip = (Math.max(parseInt(page, 10) || 1, 1) - 1) * perPage;

        const children = await Child.find(query).skip(skip).limit(perPage);
        return res.json(children);
    } catch (err) {
        console.error('getChildren error:', err.stack || err);
        res.status(500).json({ error: err.message });
    }
};

// GET children for a specific orphanage - public/authorized users (not orphanAdmin)
const getChildrenByOrphanage = async (req, res) => {
    try {
        const role = req.user?.role || req.user?.type;
        if (isOrphanAdmin(req.user)) {
            return res.status(403).json({ success: false, message: 'Forbidden - orphanAdmin cannot use this route' });
        }

        const { orphanageId: paramId } = req.params;
        if (!paramId) return res.status(400).json({ error: 'orphanageId is required' });

        const children = await Child.find({ orphanageId: paramId }).limit(500);
        return res.json(children);
    } catch (err) {
        console.error('getChildrenByOrphanage error:', err.stack || err);
        return res.status(500).json({ error: err.message });
    }
};

const getChildById = async (req, res) => {
    try {
        const child = await Child.findById(req.params.id);
        if (!child) return res.status(404).json({ error: 'Not found' });
        res.json(child);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
};

const updateChild = async (req, res) => {
    let newImageFileId = null;
    const newDocumentFileIds = [];

    try {
        /* ================= AUTH CHECK ================= */
        console.log('🔍 updateChild - req.user:', JSON.stringify(req.user, null, 2));
        
        if (!req.user) {
            return res.status(401).json({ success: false, message: 'Unauthorized' });
        }

        const role = req.user?.role || req.user?.type;
        console.log('🔍 updateChild - extracted role:', role);
        
        if (!isOrphanAdmin(req.user)) {
            return res.status(403).json({ success: false, message: 'Forbidden - orphanAdmin only' });
        }

        /* ================= CHILD CHECK ================= */
        const child = await Child.findById(req.params.id);
        if (!child) {
            return res.status(404).json({ success: false, message: 'Child not found' });
        }

        /* ================= ORPHANAGE OWNERSHIP CHECK ================= */
        const orphanageId = await getRequestOrphanageId(req);
        if (!orphanageId) {
            return res.status(403).json({ success: false, message: 'Forbidden - orphanage mismatch' });
        }

        if (String(child.orphanageId) !== String(orphanageId)) {
            return res.status(403).json({ success: false, message: 'Forbidden - orphanage mismatch' });
        }

        /* ================= TEXT DATA UPDATE ================= */
        const forbiddenFields = [
            '_id',
            'orphanageId',
            'createdBy',
            'createdAt',
            'updatedAt',
            'profileUrl',
            'profileFileId',
            'documents'
        ];

        const updates = { ...req.body };
        forbiddenFields.forEach(field => delete updates[field]);

        Object.assign(child, updates);

        /* ================= IMAGE UPDATE ================= */
        let imageFile = null;
        if (req.files?.image?.[0]) imageFile = req.files.image[0];
        else if (req.file?.fieldname === 'image') imageFile = req.file;

        if (imageFile) {
            const oldImageFileId = child.profileFileId;

            const imageResult = await uploadBuffer(
                imageFile.buffer,
                imageFile.originalname,
                `children/${child._id}/image`,
                imageFile.mimetype
            );

            child.profileUrl = imageResult.url;
            child.profileFileId = imageResult.fileId || imageResult.file_id;
            newImageFileId = child.profileFileId;

            // delete old image AFTER successful upload (best-effort, non-blocking)
            if (oldImageFileId) {
                try {
                    await deleteFile(oldImageFileId);
                } catch (deleteErr) {
                    // Log but don't fail the update - the new image is already uploaded
                    console.warn('Failed to delete old profile image (non-fatal):', deleteErr.message || deleteErr);
                }
            }
        }

        /* ================= DOCUMENT UPLOAD ================= */
        let documentFiles = [];

        if (req.files?.documents?.length) {
            documentFiles = req.files.documents;
        } else if (Array.isArray(req.files)) {
            documentFiles = req.files.filter(f => f.fieldname === 'documents');
        }

        if (documentFiles.length) {
            child.documents = Array.isArray(child.documents) ? child.documents : [];

            for (const file of documentFiles) {
                const docResult = await uploadBuffer(
                    file.buffer,
                    file.originalname,
                    `children/${child._id}/documents`,
                    file.mimetype
                );

                child.documents.push({
                    url: docResult.url,
                    fileId: docResult.fileId || docResult.file_id,
                    name: file.originalname
                });

                newDocumentFileIds.push(docResult.fileId || docResult.file_id);
            }
        }

        /* ================= SAVE ================= */
        const updatedChild = await child.save();
        return res.status(200).json(updatedChild);

    } catch (error) {
        /* ================= CLEANUP ON FAILURE ================= */
        try {
            if (newImageFileId) {
                await deleteFile(newImageFileId);
            }

            for (const fileId of newDocumentFileIds) {
                if (fileId) await deleteFile(fileId);
            }
        } catch (cleanupErr) {
            console.error('Cleanup failed:', cleanupErr);
        }

        console.error('updateChild error:', error);
        return res.status(400).json({
            success: false,
            message: error.message
        });
    }
};


const deleteChild = async (req, res) => {
    try {
        console.log('🔍 deleteChild - req.user:', JSON.stringify(req.user, null, 2));
        
        const role = req.user?.role || req.user?.type;
        console.log('🔍 deleteChild - extracted role:', role);
        
        if (!isOrphanAdmin(req.user)) {
            return res.status(403).json({ success: false, message: "Forbidden - orphanAdmin only" });
        }

        const child = await Child.findById(req.params.id);
        if (!child) return res.status(404).json({ error: 'Not found' });
        console.log(req.user)
        console.log(child)

        // ensure admin belongs to same orphanage as the child
        const orphanageId = await getRequestOrphanageId(req);
        if (!orphanageId || String(child.orphanageId) !== String(orphanageId)) {
            return res.status(403).json({ success: false, message: 'Forbidden - orphanage mismatch' });
        }

        // collect file ids to delete from ImageKit
        const fileIds = [];
        if (child.profileFileId) fileIds.push(child.profileFileId);
        if (Array.isArray(child.documents)) {
            for (const d of child.documents) {
                if (d.fileId) fileIds.push(d.fileId);
                if (d.file_id) fileIds.push(d.file_id);
            }
        }

        const deleteErrors = [];
        for (const fid of fileIds) {
            try {
                await deleteFile(fid);
            } catch (e) {
                deleteErrors.push({ fileId: fid, message: e.message || e });
            }
        }

        // finally remove child document
        await Child.findByIdAndDelete(child._id);

        return res.json({ success: true, deletedFiles: fileIds.length, deleteErrors });
    } catch (err) {
        console.error('deleteChild error:', err.stack || err);
        res.status(500).json({ error: err.message });
    }
};

// DELETE a specific uploaded file (profile image or document) from a child
const deleteChildFile = async (req, res) => {
    try {
        console.log('🔍 deleteChildFile - req.user:', JSON.stringify(req.user, null, 2));
        
        const role = req.user?.role || req.user?.type;
        console.log('🔍 deleteChildFile - extracted role:', role);
        
        if (!isOrphanAdmin(req.user)) {
            return res.status(403).json({ success: false, message: "Forbidden - orphanAdmin only" });
        }

        const { id, fileId } = req.params;
        if (!fileId) return res.status(400).json({ error: 'fileId is required' });

        const child = await Child.findById(id);
        if (!child) return res.status(404).json({ error: 'Child not found' });

        const orphanageId = await getRequestOrphanageId(req);
        if (!orphanageId || String(child.orphanageId) !== String(orphanageId)) {
            return res.status(403).json({ success: false, message: 'Forbidden - orphanage mismatch' });
        }

        // If it's the profile image
        if (child.profileFileId && (child.profileFileId === fileId || child.profileFileId === fileId)) {
            await deleteFile(fileId);
            child.profileFileId = undefined;
            child.profileUrl = undefined;
            await child.save();
            return res.json({ success: true, data: child });
        }

        // Otherwise try to find it in documents
        if (Array.isArray(child.documents) && child.documents.length) {
            const idx = child.documents.findIndex(d => d.fileId === fileId || d.file_id === fileId);
            if (idx !== -1) {
                await deleteFile(fileId);
                child.documents.splice(idx, 1);
                await child.save();
                return res.json({ success: true, data: child });
            }
        }

        return res.status(404).json({ error: 'File not found on child' });
    } catch (err) {
        console.error('deleteChildFile error:', err.stack || err);
        return res.status(500).json({ error: err.message });
    }
};
module.exports = {
    createChild,
    getChildren,
    getChildrenByOrphanage,
    getChildById,
    updateChild,
    deleteChild,
    deleteChildFile
}