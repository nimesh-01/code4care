import { FaShieldAlt } from 'react-icons/fa'
import Navbar from '../components/Navbar'
import { ScrollReveal } from '../hooks/useScrollReveal'

const Privacy = () => {
  return (
    <div className="min-h-screen bg-cream-50 dark:bg-dark-900 transition-colors duration-300">
      <Navbar />

      {/* Header */}
      <section className="pt-28 pb-12 bg-gradient-to-br from-teal-600 to-teal-800 dark:from-teal-800 dark:to-dark-950">
        <ScrollReveal animation="fade-up" className="container mx-auto px-6 text-center">
          <div className="flex justify-center mb-4">
            <FaShieldAlt className="text-coral-400 text-4xl" />
          </div>
          <h1 className="text-4xl lg:text-5xl font-playfair font-bold text-white mb-4">
            Privacy <span className="text-coral-400">Policy</span>
          </h1>
          <p className="text-cream-100/80 text-lg max-w-2xl mx-auto">
            Your privacy matters to us. Learn how SoulConnect handles your data.
          </p>
        </ScrollReveal>
      </section>

      {/* Content */}
      <section className="py-16">
        <div className="container mx-auto px-6 max-w-4xl">
          <ScrollReveal animation="fade-up" className="bg-white dark:bg-dark-800 rounded-2xl shadow-lg p-8 lg:p-12 border border-cream-200 dark:border-dark-700 space-y-8">

            <PolicySection title="1. Information We Collect">
              <p>When you use SoulConnect, we may collect the following information:</p>
              <ul className="list-disc pl-6 mt-2 space-y-1">
                <li>Personal details you provide during registration (name, email, phone number).</li>
                <li>Profile information such as your role (donor, volunteer, orphanage admin).</li>
                <li>Donation and transaction records.</li>
                <li>Messages sent through the chat feature.</li>
                <li>Usage data such as pages visited and features used.</li>
              </ul>
            </PolicySection>

            <PolicySection title="2. How We Use Your Information">
              <p>We use the collected information to:</p>
              <ul className="list-disc pl-6 mt-2 space-y-1">
                <li>Provide and improve our platform services.</li>
                <li>Facilitate donations and connect users with orphanages.</li>
                <li>Send notifications about appointments, events, and updates.</li>
                <li>Ensure platform security and prevent fraud.</li>
                <li>Communicate important changes to our services.</li>
              </ul>
            </PolicySection>

            <PolicySection title="3. Data Sharing">
              <p>
                We do not sell or rent your personal information to third parties. Your data may be shared with orphanage administrators only to the extent necessary to fulfill donations, appointments, or volunteer activities you initiate.
              </p>
            </PolicySection>

            <PolicySection title="4. Data Security">
              <p>
                We implement appropriate security measures including encryption, secure authentication, and access controls to protect your personal information. However, no method of transmission over the Internet is 100% secure.
              </p>
            </PolicySection>

            <PolicySection title="5. Cookies">
              <p>
                SoulConnect uses cookies and local storage to maintain your session, remember your preferences (such as theme settings), and improve your experience on the platform.
              </p>
            </PolicySection>

            <PolicySection title="6. Your Rights">
              <p>You have the right to:</p>
              <ul className="list-disc pl-6 mt-2 space-y-1">
                <li>Access and review the personal data we hold about you.</li>
                <li>Request corrections to inaccurate information.</li>
                <li>Request deletion of your account and associated data.</li>
                <li>Opt out of non-essential communications.</li>
              </ul>
            </PolicySection>

            <PolicySection title="7. Children's Privacy">
              <p>
                SoulConnect displays publicly shared information about children in orphanages for sponsorship and support purposes. Sensitive information about children is managed solely by authorized orphanage administrators and is not disclosed beyond what is necessary.
              </p>
            </PolicySection>

            <PolicySection title="8. Changes to This Policy">
              <p>
                We may update this privacy policy from time to time. Any changes will be posted on this page with an updated effective date. We encourage you to review this policy periodically.
              </p>
            </PolicySection>

            <PolicySection title="9. Contact Us">
              <p>
                If you have any questions about this privacy policy or how your data is handled, please contact us at{' '}
                <a href="mailto:support@soulconnect.org" className="text-coral-500 hover:text-coral-600 dark:text-coral-400 underline">
                  support@soulconnect.org
                </a>.
              </p>
            </PolicySection>

            <div className="pt-4 border-t border-cream-200 dark:border-dark-600 text-sm text-teal-600 dark:text-cream-200/60">
              Last updated: June 2025
            </div>
          </ScrollReveal>
        </div>
      </section>
    </div>
  )
}

const PolicySection = ({ title, children }) => (
  <div>
    <h2 className="text-xl font-playfair font-bold text-teal-900 dark:text-cream-50 mb-3">{title}</h2>
    <div className="text-teal-700 dark:text-cream-200 leading-relaxed">{children}</div>
  </div>
)

export default Privacy
