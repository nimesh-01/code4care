import { Link } from 'react-router-dom'
import { FaHeart, FaHandHoldingHeart, FaUsers, FaChild } from 'react-icons/fa'
import Navbar from '../components/Navbar'

const Home = () => {
  return (
    <div className="min-h-screen">
      <Navbar />
      
      {/* Hero Section */}
      <section className="gradient-bg min-h-[90vh] flex items-center">
        <div className="container mx-auto px-6 py-20">
          <div className="flex flex-col lg:flex-row items-center justify-between">
            <div className="lg:w-1/2 text-white mb-12 lg:mb-0">
              <h1 className="text-5xl lg:text-7xl font-bold mb-6 leading-tight">
                Connecting Hearts,
                <span className="block text-yellow-300">Changing Lives</span>
              </h1>
              <p className="text-xl mb-8 text-white/90 max-w-lg">
                SoulConnect bridges the gap between orphanages and caring individuals. 
                Join us in making a difference, one connection at a time.
              </p>
              <div className="flex flex-wrap gap-4">
                <Link to="/register" className="btn-primary bg-white !text-soul-purple hover:scale-105">
                  Get Started
                </Link>
                <Link to="/login" className="btn-secondary !border-white !text-white hover:!bg-white hover:!text-soul-purple">
                  Login
                </Link>
              </div>
            </div>
            <div className="lg:w-1/2 flex justify-center">
              <div className="relative">
                <div className="w-80 h-80 bg-white/20 rounded-full flex items-center justify-center animate-float">
                  <FaHeart className="text-white text-9xl" />
                </div>
                <div className="absolute -top-4 -right-4 w-20 h-20 bg-yellow-300 rounded-full flex items-center justify-center shadow-lg">
                  <FaChild className="text-soul-purple text-3xl" />
                </div>
                <div className="absolute -bottom-4 -left-4 w-16 h-16 bg-soul-teal rounded-full flex items-center justify-center shadow-lg">
                  <FaHandHoldingHeart className="text-white text-2xl" />
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-20 bg-white">
        <div className="container mx-auto px-6">
          <h2 className="text-4xl font-bold text-center mb-16 text-gray-800">
            How <span className="text-soul-purple">SoulConnect</span> Works
          </h2>
          <div className="grid md:grid-cols-3 gap-8">
            <FeatureCard 
              icon={<FaUsers className="text-5xl text-soul-purple" />}
              title="Connect"
              description="Register as a user, volunteer, or admin to join our community of caring individuals."
            />
            <FeatureCard 
              icon={<FaHandHoldingHeart className="text-5xl text-soul-pink" />}
              title="Support"
              description="Donate, volunteer, or sponsor children at orphanages near you."
            />
            <FeatureCard 
              icon={<FaHeart className="text-5xl text-soul-teal" />}
              title="Transform"
              description="Watch lives change as your support reaches those who need it most."
            />
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 gradient-bg">
        <div className="container mx-auto px-6 text-center">
          <h2 className="text-4xl font-bold text-white mb-6">
            Ready to Make a Difference?
          </h2>
          <p className="text-xl text-white/90 mb-8 max-w-2xl mx-auto">
            Join thousands of volunteers and donors who are already transforming lives through SoulConnect.
          </p>
          <Link to="/register" className="inline-block bg-white text-soul-purple font-bold py-4 px-8 rounded-lg shadow-lg hover:shadow-xl transform hover:scale-105 transition-all duration-200">
            Join SoulConnect Today
          </Link>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-gray-900 py-12">
        <div className="container mx-auto px-6">
          <div className="flex flex-col md:flex-row justify-between items-center">
            <div className="text-white mb-6 md:mb-0">
              <h3 className="text-2xl font-bold flex items-center gap-2">
                <FaHeart className="text-soul-pink" />
                SoulConnect
              </h3>
              <p className="text-gray-400 mt-2">Connecting Hearts, Changing Lives</p>
            </div>
            <div className="flex gap-8 text-gray-400">
              <Link to="/about" className="hover:text-white transition">About</Link>
              <Link to="/contact" className="hover:text-white transition">Contact</Link>
              <Link to="/privacy" className="hover:text-white transition">Privacy</Link>
            </div>
          </div>
          <div className="border-t border-gray-800 mt-8 pt-8 text-center text-gray-500">
            <p>&copy; 2026 SoulConnect. All rights reserved.</p>
          </div>
        </div>
      </footer>
    </div>
  )
}

const FeatureCard = ({ icon, title, description }) => (
  <div className="card hover:shadow-2xl transition-shadow duration-300 text-center">
    <div className="flex justify-center mb-6">{icon}</div>
    <h3 className="text-2xl font-bold mb-4 text-gray-800">{title}</h3>
    <p className="text-gray-600">{description}</p>
  </div>
)

export default Home
