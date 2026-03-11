import { useState } from 'react'
import { FaEnvelope, FaPhone, FaMapMarkerAlt, FaHeart, FaPaperPlane } from 'react-icons/fa'
import Navbar from '../components/Navbar'
import { ScrollReveal } from '../hooks/useScrollReveal'

const Contact = () => {
  const [form, setForm] = useState({ name: '', email: '', subject: '', message: '' })
  const [submitted, setSubmitted] = useState(false)

  const handleChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value })
  }

  const handleSubmit = (e) => {
    e.preventDefault()
    setSubmitted(true)
    setForm({ name: '', email: '', subject: '', message: '' })
  }

  return (
    <div className="min-h-screen bg-cream-50 dark:bg-dark-900 transition-colors duration-300">
      <Navbar />

      {/* Header */}
      <section className="pt-28 pb-12 bg-gradient-to-br from-teal-600 to-teal-800 dark:from-teal-800 dark:to-dark-950">
        <ScrollReveal animation="fade-up" className="container mx-auto px-6 text-center">
          <h1 className="text-4xl lg:text-5xl font-playfair font-bold text-white mb-4">
            Get in <span className="text-coral-400">Touch</span>
          </h1>
          <p className="text-cream-100/80 text-lg max-w-2xl mx-auto">
            Have questions or want to get involved? We'd love to hear from you.
          </p>
        </ScrollReveal>
      </section>

      {/* Contact Content */}
      <section className="py-16">
        <div className="container mx-auto px-6">
          <div className="grid lg:grid-cols-2 gap-12">
            {/* Contact Info */}
            <ScrollReveal animation="fade-right">
              <h2 className="text-3xl font-playfair font-bold text-teal-900 dark:text-cream-50 mb-6">
                Contact Information
              </h2>
              <p className="text-teal-700 dark:text-cream-200 mb-8 leading-relaxed">
                Reach out to us through any of the channels below or fill out the contact form and we'll get back to you as soon as possible.
              </p>

              <div className="space-y-6">
                <ContactInfo
                  icon={<FaEnvelope className="text-coral-500 dark:text-coral-400 text-xl" />}
                  label="Email"
                  value="support@soulconnect.org"
                />
                <ContactInfo
                  icon={<FaPhone className="text-coral-500 dark:text-coral-400 text-xl" />}
                  label="Phone"
                  value="+251 911 234 567"
                />
                <ContactInfo
                  icon={<FaMapMarkerAlt className="text-coral-500 dark:text-coral-400 text-xl" />}
                  label="Address"
                  value="Addis Ababa, Ethiopia"
                />
              </div>

              <div className="mt-10 p-6 bg-teal-50 dark:bg-dark-800 rounded-2xl border border-teal-100 dark:border-dark-700">
                <h3 className="text-lg font-semibold text-teal-900 dark:text-cream-50 mb-2 flex items-center gap-2">
                  <FaHeart className="text-coral-500" /> Volunteer With Us
                </h3>
                <p className="text-teal-700 dark:text-cream-200 text-sm">
                  Interested in volunteering? Register on our platform and select "Volunteer" as your role to start making an impact.
                </p>
              </div>
            </ScrollReveal>

            {/* Contact Form */}
            <ScrollReveal animation="fade-left" delay={200} className="bg-white dark:bg-dark-800 rounded-2xl shadow-lg p-8 border border-cream-200 dark:border-dark-700">
              {submitted ? (
                <div className="text-center py-12">
                  <div className="w-16 h-16 bg-teal-100 dark:bg-teal-900/30 rounded-full flex items-center justify-center mx-auto mb-4">
                    <FaPaperPlane className="text-teal-600 dark:text-teal-400 text-2xl" />
                  </div>
                  <h3 className="text-2xl font-playfair font-bold text-teal-900 dark:text-cream-50 mb-2">
                    Message Sent!
                  </h3>
                  <p className="text-teal-700 dark:text-cream-200 mb-6">
                    Thank you for reaching out. We'll get back to you soon.
                  </p>
                  <button
                    onClick={() => setSubmitted(false)}
                    className="px-6 py-2 bg-coral-500 hover:bg-coral-600 text-white rounded-full transition"
                  >
                    Send Another Message
                  </button>
                </div>
              ) : (
                <form onSubmit={handleSubmit} className="space-y-5">
                  <h2 className="text-2xl font-playfair font-bold text-teal-900 dark:text-cream-50 mb-2">
                    Send Us a Message
                  </h2>
                  <div>
                    <label className="block text-sm font-medium text-teal-800 dark:text-cream-100 mb-1">Name</label>
                    <input
                      type="text"
                      name="name"
                      value={form.name}
                      onChange={handleChange}
                      required
                      className="w-full px-4 py-3 rounded-xl bg-cream-50 dark:bg-dark-700 border border-cream-200 dark:border-dark-600 text-teal-900 dark:text-cream-50 focus:outline-none focus:ring-2 focus:ring-coral-400"
                      placeholder="Your name"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-teal-800 dark:text-cream-100 mb-1">Email</label>
                    <input
                      type="email"
                      name="email"
                      value={form.email}
                      onChange={handleChange}
                      required
                      className="w-full px-4 py-3 rounded-xl bg-cream-50 dark:bg-dark-700 border border-cream-200 dark:border-dark-600 text-teal-900 dark:text-cream-50 focus:outline-none focus:ring-2 focus:ring-coral-400"
                      placeholder="your@email.com"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-teal-800 dark:text-cream-100 mb-1">Subject</label>
                    <input
                      type="text"
                      name="subject"
                      value={form.subject}
                      onChange={handleChange}
                      required
                      className="w-full px-4 py-3 rounded-xl bg-cream-50 dark:bg-dark-700 border border-cream-200 dark:border-dark-600 text-teal-900 dark:text-cream-50 focus:outline-none focus:ring-2 focus:ring-coral-400"
                      placeholder="How can we help?"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-teal-800 dark:text-cream-100 mb-1">Message</label>
                    <textarea
                      name="message"
                      value={form.message}
                      onChange={handleChange}
                      required
                      rows={5}
                      className="w-full px-4 py-3 rounded-xl bg-cream-50 dark:bg-dark-700 border border-cream-200 dark:border-dark-600 text-teal-900 dark:text-cream-50 focus:outline-none focus:ring-2 focus:ring-coral-400 resize-none"
                      placeholder="Tell us more..."
                    />
                  </div>
                  <button
                    type="submit"
                    className="w-full py-3 bg-coral-500 hover:bg-coral-600 text-white font-semibold rounded-full shadow-md hover:shadow-lg transition-all duration-300"
                  >
                    Send Message
                  </button>
                </form>
              )}
            </ScrollReveal>
          </div>
        </div>
      </section>
    </div>
  )
}

const ContactInfo = ({ icon, label, value }) => (
  <div className="flex items-start gap-4">
    <div className="w-10 h-10 bg-coral-100 dark:bg-coral-900/30 rounded-full flex items-center justify-center flex-shrink-0">
      {icon}
    </div>
    <div>
      <p className="text-sm text-teal-600 dark:text-teal-400 font-medium">{label}</p>
      <p className="text-teal-900 dark:text-cream-50">{value}</p>
    </div>
  </div>
)

export default Contact
