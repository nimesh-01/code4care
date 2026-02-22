import { Link } from 'react-router-dom'
import { FaHeart, FaHandHoldingHeart, FaUsers, FaChild, FaDonate, FaCalendarAlt, FaComments } from 'react-icons/fa'
import Navbar from '../components/Navbar'

const Home = () => {
  return (
    <div className="min-h-screen bg-cream-50 dark:bg-dark-900 transition-colors duration-300">
      <Navbar />
      
      {/* Hero Section */}
      <section className="min-h-screen flex items-center relative overflow-hidden pt-20">
        {/* Background Pattern */}
        <div className="absolute inset-0 opacity-5 dark:opacity-10">
          <div className="absolute top-20 left-10 w-40 h-40 bg-coral-300 rounded-full blur-3xl"></div>
          <div className="absolute bottom-20 right-10 w-60 h-60 bg-teal-300 rounded-full blur-3xl"></div>
          <div className="absolute top-1/2 left-1/2 w-80 h-80 bg-coral-200 rounded-full blur-3xl transform -translate-x-1/2 -translate-y-1/2"></div>
        </div>
        
        <div className="container mx-auto px-6 py-20 relative z-10">
          <div className="flex flex-col lg:flex-row items-center justify-between gap-12">
            <div className="lg:w-1/2 mb-12 lg:mb-0">
              <span className="inline-block px-4 py-2 bg-coral-100 dark:bg-coral-900/30 text-coral-600 dark:text-coral-400 rounded-full text-sm font-medium mb-6">
                Welcome to SoulConnect
              </span>
              <h1 className="text-5xl lg:text-6xl font-playfair font-bold mb-6 leading-tight text-teal-900 dark:text-cream-50">
                Connecting Hearts,
                <span className="block text-coral-500 dark:text-coral-400">Changing Lives</span>
              </h1>
              <p className="text-xl mb-8 text-teal-700 dark:text-cream-200 max-w-lg leading-relaxed">
                SoulConnect bridges the gap between orphanages and caring individuals. 
                Join us in making a difference, one connection at a time.
              </p>
              <div className="flex flex-wrap gap-4">
                <Link to="/register" className="px-8 py-4 bg-coral-500 hover:bg-coral-600 text-white font-semibold rounded-full shadow-lg hover:shadow-xl transform hover:scale-105 transition-all duration-300">
                  Get Started
                </Link>
                <Link to="/about" className="px-8 py-4 border-2 border-teal-600 dark:border-teal-400 text-teal-600 dark:text-teal-400 font-semibold rounded-full hover:bg-teal-600 hover:text-white dark:hover:bg-teal-400 dark:hover:text-dark-900 transition-all duration-300">
                  Learn More
                </Link>
              </div>
            </div>
            
            {/* Heart-shaped Image Container */}
            <div className="lg:w-1/2 flex justify-center">
              <div className="relative">
                {/* Main Heart Container */}
                <div className="w-80 h-80 lg:w-96 lg:h-96 relative">
                  <svg viewBox="0 0 100 100" className="w-full h-full drop-shadow-2xl">
                    <defs>
                      <clipPath id="heartClip">
                        <path d="M50,88 C50,88 90,60 90,35 C90,20 77,10 65,10 C55,10 50,20 50,20 C50,20 45,10 35,10 C23,10 10,20 10,35 C10,60 50,88 50,88 Z" />
                      </clipPath>
                      <linearGradient id="heartGradient" x1="0%" y1="0%" x2="100%" y2="100%">
                        <stop offset="0%" className="text-coral-300" stopColor="currentColor" />
                        <stop offset="100%" className="text-coral-500" stopColor="currentColor" />
                      </linearGradient>
                    </defs>
                    <path 
                      d="M50,88 C50,88 90,60 90,35 C90,20 77,10 65,10 C55,10 50,20 50,20 C50,20 45,10 35,10 C23,10 10,20 10,35 C10,60 50,88 50,88 Z" 
                      fill="url(#heartGradient)"
                      className="animate-pulse"
                    />
                    <g clipPath="url(#heartClip)">
                      <rect width="100" height="100" className="fill-coral-400 dark:fill-coral-500" />
                      {/* Abstract children silhouettes */}
                      <circle cx="35" cy="40" r="8" className="fill-coral-200 dark:fill-coral-300" />
                      <circle cx="65" cy="40" r="8" className="fill-coral-200 dark:fill-coral-300" />
                      <circle cx="50" cy="55" r="10" className="fill-coral-200 dark:fill-coral-300" />
                    </g>
                  </svg>
                </div>
                
                {/* Floating Elements */}
                <div className="absolute -top-4 -right-4 w-20 h-20 bg-teal-500 dark:bg-teal-400 rounded-full flex items-center justify-center shadow-lg animate-bounce">
                  <FaChild className="text-white dark:text-dark-900 text-3xl" />
                </div>
                <div className="absolute -bottom-4 -left-4 w-16 h-16 bg-cream-400 dark:bg-cream-300 rounded-full flex items-center justify-center shadow-lg">
                  <FaHandHoldingHeart className="text-coral-500 text-2xl" />
                </div>
                <div className="absolute top-1/2 -right-8 w-12 h-12 bg-coral-200 dark:bg-coral-700 rounded-full flex items-center justify-center shadow-md">
                  <FaHeart className="text-coral-500 dark:text-coral-400 text-xl" />
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Stats Section */}
      <section className="py-16 bg-teal-600 dark:bg-teal-800">
        <div className="container mx-auto px-6">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8 text-center">
            <StatCard number="500+" label="Orphanages" />
            <StatCard number="10K+" label="Children" />
            <StatCard number="25K+" label="Donors" />
            <StatCard number="$2M+" label="Donated" />
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-20 bg-cream-100 dark:bg-dark-800 transition-colors duration-300">
        <div className="container mx-auto px-6">
          <div className="text-center mb-16">
            <span className="inline-block px-4 py-2 bg-coral-100 dark:bg-coral-900/30 text-coral-600 dark:text-coral-400 rounded-full text-sm font-medium mb-4">
              Our Services
            </span>
            <h2 className="text-4xl font-playfair font-bold text-teal-900 dark:text-cream-50 mb-4">
              How <span className="text-coral-500 dark:text-coral-400">SoulConnect</span> Works
            </h2>
            <p className="text-teal-700 dark:text-cream-200 max-w-2xl mx-auto">
              We provide a seamless platform for connecting caring individuals with orphanages in need.
            </p>
          </div>
          
          <div className="grid md:grid-cols-3 gap-8">
            <FeatureCard 
              icon={<FaUsers className="text-5xl text-coral-500 dark:text-coral-400" />}
              title="Connect"
              description="Register as a user, volunteer, or admin to join our community of caring individuals."
            />
            <FeatureCard 
              icon={<FaDonate className="text-5xl text-teal-500 dark:text-teal-400" />}
              title="Support"
              description="Donate, volunteer, or sponsor children at orphanages near you."
            />
            <FeatureCard 
              icon={<FaHeart className="text-5xl text-coral-500 dark:text-coral-400" />}
              title="Transform"
              description="Watch lives change as your support reaches those who need it most."
            />
          </div>
        </div>
      </section>

      {/* Services Grid */}
      <section className="py-20 bg-cream-50 dark:bg-dark-900 transition-colors duration-300">
        <div className="container mx-auto px-6">
          <div className="text-center mb-16">
            <span className="inline-block px-4 py-2 bg-teal-100 dark:bg-teal-900/30 text-teal-600 dark:text-teal-400 rounded-full text-sm font-medium mb-4">
              What We Offer
            </span>
            <h2 className="text-4xl font-playfair font-bold text-teal-900 dark:text-cream-50">
              Our <span className="text-coral-500 dark:text-coral-400">Services</span>
            </h2>
          </div>
          
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
            <ServiceCard 
              icon={<FaDonate />}
              title="Donations"
              description="Make secure donations directly to orphanages of your choice."
              color="coral"
            />
            <ServiceCard 
              icon={<FaCalendarAlt />}
              title="Appointments"
              description="Schedule visits and volunteering sessions at orphanages."
              color="teal"
            />
            <ServiceCard 
              icon={<FaComments />}
              title="Chat Support"
              description="Connect directly with orphanage administrators."
              color="coral"
            />
            <ServiceCard 
              icon={<FaChild />}
              title="Child Sponsorship"
              description="Sponsor a child's education and daily needs."
              color="teal"
            />
            <ServiceCard 
              icon={<FaUsers />}
              title="Volunteer Programs"
              description="Join our volunteer network and make a difference."
              color="coral"
            />
            <ServiceCard 
              icon={<FaHandHoldingHeart />}
              title="Emergency Relief"
              description="Support orphanages during emergencies and crises."
              color="teal"
            />
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 bg-gradient-to-br from-coral-400 to-coral-600 dark:from-coral-600 dark:to-coral-800 relative overflow-hidden">
        <div className="absolute inset-0 opacity-10">
          <div className="absolute top-10 left-10 w-40 h-40 bg-white rounded-full blur-3xl"></div>
          <div className="absolute bottom-10 right-10 w-60 h-60 bg-white rounded-full blur-3xl"></div>
        </div>
        <div className="container mx-auto px-6 text-center relative z-10">
          <h2 className="text-4xl font-playfair font-bold text-white mb-6">
            Ready to Make a Difference?
          </h2>
          <p className="text-xl text-white/90 mb-8 max-w-2xl mx-auto">
            Join thousands of volunteers and donors who are already transforming lives through SoulConnect.
          </p>
          <Link to="/register" className="inline-block bg-white text-coral-600 font-bold py-4 px-8 rounded-full shadow-lg hover:shadow-xl transform hover:scale-105 transition-all duration-300">
            Join SoulConnect Today
          </Link>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-teal-900 dark:bg-dark-950 py-12 transition-colors duration-300">
        <div className="container mx-auto px-6">
          <div className="flex flex-col md:flex-row justify-between items-center">
            <div className="text-white mb-6 md:mb-0">
              <h3 className="text-2xl font-playfair font-bold flex items-center gap-2">
                <FaHeart className="text-coral-400" />
                SoulConnect
              </h3>
              <p className="text-cream-200/70 mt-2">Connecting Hearts, Changing Lives</p>
            </div>
            <div className="flex gap-8 text-cream-200/70">
              <Link to="/about" className="hover:text-coral-400 transition">About</Link>
              <Link to="/contact" className="hover:text-coral-400 transition">Contact</Link>
              <Link to="/privacy" className="hover:text-coral-400 transition">Privacy</Link>
            </div>
          </div>
          <div className="border-t border-teal-800 dark:border-dark-800 mt-8 pt-8 text-center text-cream-200/50">
            <p>&copy; 2026 SoulConnect. All rights reserved.</p>
          </div>
        </div>
      </footer>
    </div>
  )
}

const StatCard = ({ number, label }) => (
  <div className="text-white">
    <div className="text-4xl font-bold mb-2">{number}</div>
    <div className="text-cream-100/80">{label}</div>
  </div>
)

const FeatureCard = ({ icon, title, description }) => (
  <div className="bg-cream-50 dark:bg-dark-700 rounded-2xl p-8 shadow-lg hover:shadow-xl transition-all duration-300 text-center group hover:-translate-y-2">
    <div className="flex justify-center mb-6 group-hover:scale-110 transition-transform duration-300">{icon}</div>
    <h3 className="text-2xl font-playfair font-bold mb-4 text-teal-900 dark:text-cream-50">{title}</h3>
    <p className="text-teal-700 dark:text-cream-200">{description}</p>
  </div>
)

const ServiceCard = ({ icon, title, description, color }) => (
  <div className={`bg-white dark:bg-dark-800 rounded-2xl p-6 shadow-md hover:shadow-xl transition-all duration-300 group hover:-translate-y-1 border-l-4 ${color === 'coral' ? 'border-coral-500' : 'border-teal-500'}`}>
    <div className={`w-12 h-12 rounded-full flex items-center justify-center mb-4 ${color === 'coral' ? 'bg-coral-100 dark:bg-coral-900/30 text-coral-500 dark:text-coral-400' : 'bg-teal-100 dark:bg-teal-900/30 text-teal-500 dark:text-teal-400'}`}>
      {icon}
    </div>
    <h3 className="text-xl font-semibold mb-2 text-teal-900 dark:text-cream-50">{title}</h3>
    <p className="text-teal-700 dark:text-cream-200 text-sm">{description}</p>
  </div>
)

export default Home
