import { FaHeart, FaHandHoldingHeart, FaUsers, FaGlobe, FaAward, FaCheckCircle } from 'react-icons/fa'
import Navbar from '../components/Navbar'
import { useTheme } from '../context/ThemeContext'

const About = () => {
  const { isDarkMode } = useTheme()

  const stats = [
    { value: '156+', label: 'Partner Orphanages', icon: <FaHeart /> },
    { value: '12,000+', label: 'Children Supported', icon: <FaHandHoldingHeart /> },
    { value: '5,000+', label: 'Active Volunteers', icon: <FaUsers /> },
    { value: '25+', label: 'Cities Covered', icon: <FaGlobe /> },
  ]

  const values = [
    {
      title: 'Compassion',
      description: 'We believe every child deserves love, care, and the opportunity to thrive regardless of their circumstances.',
      icon: <FaHeart className="text-coral-500" />,
    },
    {
      title: 'Transparency',
      description: 'Every donation is tracked and reported. We ensure 100% of your contributions reach those in need.',
      icon: <FaCheckCircle className="text-teal-500" />,
    },
    {
      title: 'Community',
      description: 'We build bridges between caring individuals and orphanages, creating a supportive network of change-makers.',
      icon: <FaUsers className="text-coral-400" />,
    },
    {
      title: 'Excellence',
      description: 'We strive for the highest standards in everything we do, ensuring maximum impact for every contribution.',
      icon: <FaAward className="text-teal-400" />,
    },
  ]

  const team = [
    { name: 'Priya Sharma', role: 'Founder & CEO', image: 'https://randomuser.me/api/portraits/women/44.jpg' },
    { name: 'Rahul Verma', role: 'Head of Operations', image: 'https://randomuser.me/api/portraits/men/32.jpg' },
    { name: 'Anita Desai', role: 'Community Manager', image: 'https://randomuser.me/api/portraits/women/68.jpg' },
    { name: 'Vikram Singh', role: 'Tech Lead', image: 'https://randomuser.me/api/portraits/men/75.jpg' },
  ]

  return (
    <div className="min-h-screen bg-cream-50 dark:bg-dark-900 transition-colors duration-300">
      <Navbar />

      {/* Hero Section */}
      <section className="pt-32 pb-20 bg-gradient-to-br from-teal-800 to-teal-900 dark:from-dark-800 dark:to-dark-950">
        <div className="container mx-auto px-6 text-center">
          <h1 className="text-4xl md:text-5xl font-playfair font-bold text-white mb-6">
            About <span className="text-coral-400">SoulConnect</span>
          </h1>
          <p className="text-xl text-cream-100/80 max-w-3xl mx-auto leading-relaxed">
            We are on a mission to transform the lives of orphaned children across India by connecting 
            compassionate donors and dedicated volunteers with orphanages that need support.
          </p>
        </div>
      </section>

      {/* Our Story Section */}
      <section className="py-20 bg-white dark:bg-dark-800 transition-colors duration-300">
        <div className="container mx-auto px-6">
          <div className="grid md:grid-cols-2 gap-12 items-center">
            <div>
              <h2 className="text-3xl font-playfair font-bold text-teal-900 dark:text-cream-50 mb-6">
                Our Story
              </h2>
              <div className="space-y-4 text-teal-700 dark:text-cream-200">
                <p>
                  SoulConnect was born from a simple yet powerful idea: every child deserves a chance 
                  to dream, learn, and grow in a loving environment. Founded in 2020, we started as a 
                  small group of volunteers visiting local orphanages on weekends.
                </p>
                <p>
                  What began as personal visits soon revealed a much larger need. We discovered that 
                  many orphanages struggle not just with funding, but with visibility and connection 
                  to potential supporters. That's when SoulConnect evolved into a digital platform.
                </p>
                <p>
                  Today, we serve as a bridge between caring hearts and children in need. Our platform 
                  makes it easy for anyone to find verified orphanages, make secure donations, or 
                  volunteer their time and skills.
                </p>
              </div>
            </div>
            <div className="relative">
              <div className="bg-gradient-to-br from-coral-400 to-teal-500 rounded-3xl p-1">
                <img 
                  src="https://images.unsplash.com/photo-1488521787991-ed7bbaae773c?w=600&h=400&fit=crop" 
                  alt="Children at orphanage" 
                  className="rounded-3xl w-full h-80 object-cover"
                />
              </div>
              <div className="absolute -bottom-6 -left-6 bg-coral-500 text-white p-6 rounded-2xl shadow-xl">
                <p className="text-3xl font-bold">5+</p>
                <p className="text-sm">Years of Impact</p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Stats Section */}
      <section className="py-16 bg-cream-100 dark:bg-dark-850 transition-colors duration-300">
        <div className="container mx-auto px-6">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
            {stats.map((stat, index) => (
              <div key={index} className="text-center">
                <div className="w-16 h-16 mx-auto mb-4 bg-coral-100 dark:bg-coral-900/30 rounded-full flex items-center justify-center text-coral-500 text-2xl">
                  {stat.icon}
                </div>
                <p className="text-3xl font-bold text-teal-900 dark:text-cream-50">{stat.value}</p>
                <p className="text-teal-600 dark:text-cream-300">{stat.label}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Mission & Vision */}
      <section className="py-20 bg-white dark:bg-dark-800 transition-colors duration-300">
        <div className="container mx-auto px-6">
          <div className="grid md:grid-cols-2 gap-8">
            <div className="bg-gradient-to-br from-coral-500 to-coral-600 rounded-3xl p-8 text-white">
              <h3 className="text-2xl font-playfair font-bold mb-4">Our Mission</h3>
              <p className="text-cream-100/90 leading-relaxed">
                To create a seamless platform that connects compassionate individuals with orphanages, 
                making it effortless to donate, volunteer, and make a meaningful impact in the lives 
                of children who need it most.
              </p>
            </div>
            <div className="bg-gradient-to-br from-teal-600 to-teal-700 rounded-3xl p-8 text-white">
              <h3 className="text-2xl font-playfair font-bold mb-4">Our Vision</h3>
              <p className="text-cream-100/90 leading-relaxed">
                A world where every orphaned child has access to quality education, healthcare, 
                and a loving community that supports their dreams. We envision a future where 
                no child is left behind.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Our Values */}
      <section className="py-20 bg-cream-50 dark:bg-dark-900 transition-colors duration-300">
        <div className="container mx-auto px-6">
          <h2 className="text-3xl font-playfair font-bold text-teal-900 dark:text-cream-50 text-center mb-12">
            Our Core Values
          </h2>
          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
            {values.map((value, index) => (
              <div 
                key={index} 
                className="bg-white dark:bg-dark-800 rounded-2xl p-6 shadow-sm hover:shadow-lg transition-all duration-300 border-l-4 border-coral-500"
              >
                <div className="text-3xl mb-4">{value.icon}</div>
                <h3 className="text-xl font-bold text-teal-900 dark:text-cream-50 mb-2">{value.title}</h3>
                <p className="text-teal-600 dark:text-cream-300 text-sm">{value.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Team Section */}
      <section className="py-20 bg-white dark:bg-dark-800 transition-colors duration-300">
        <div className="container mx-auto px-6">
          <h2 className="text-3xl font-playfair font-bold text-teal-900 dark:text-cream-50 text-center mb-4">
            Meet Our Team
          </h2>
          <p className="text-teal-600 dark:text-cream-300 text-center mb-12 max-w-2xl mx-auto">
            A dedicated group of individuals passionate about making a difference in children's lives.
          </p>
          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8">
            {team.map((member, index) => (
              <div key={index} className="text-center group">
                <div className="relative mb-4 inline-block">
                  <img 
                    src={member.image} 
                    alt={member.name}
                    className="w-32 h-32 rounded-full object-cover mx-auto border-4 border-cream-200 dark:border-dark-600 group-hover:border-coral-500 transition-colors duration-300"
                  />
                  <div className="absolute inset-0 rounded-full bg-coral-500/20 opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
                </div>
                <h3 className="text-lg font-bold text-teal-900 dark:text-cream-50">{member.name}</h3>
                <p className="text-coral-500 dark:text-coral-400 text-sm">{member.role}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 bg-gradient-to-r from-coral-500 to-teal-600">
        <div className="container mx-auto px-6 text-center">
          <h2 className="text-3xl font-playfair font-bold text-white mb-6">
            Ready to Make a Difference?
          </h2>
          <p className="text-cream-100/80 mb-8 max-w-2xl mx-auto">
            Join our community of changemakers today. Whether you donate, volunteer, or spread the word, 
            every action counts.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <a 
              href="/register" 
              className="px-8 py-4 bg-white text-coral-600 font-semibold rounded-full hover:bg-cream-100 transition shadow-lg hover:shadow-xl"
            >
              Get Started Today
            </a>
            <a 
              href="/donate" 
              className="px-8 py-4 bg-transparent border-2 border-white text-white font-semibold rounded-full hover:bg-white/10 transition"
            >
              Donate Now
            </a>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-teal-900 dark:bg-dark-950 text-cream-100 py-12 transition-colors duration-300">
        <div className="container mx-auto px-6 text-center">
          <div className="flex items-center justify-center gap-2 mb-4">
            <FaHeart className="text-coral-400" />
            <span className="text-xl font-playfair font-bold">SoulConnect</span>
          </div>
          <p className="text-cream-200/60 text-sm">
            © 2026 SoulConnect. All rights reserved. Made with love for children in need.
          </p>
        </div>
      </footer>
    </div>
  )
}

export default About
