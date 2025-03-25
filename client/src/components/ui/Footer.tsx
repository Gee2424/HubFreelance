import { Link } from "wouter";

export default function Footer() {
  return (
    <footer className="bg-gray-800 text-white">
      <div className="container mx-auto px-4 py-12">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-8">
          <div className="lg:col-span-2">
            <h2 className="text-xl font-bold mb-4">FreelanceHub</h2>
            <p className="text-gray-400 mb-6">
              Connecting top talent with amazing opportunities worldwide. Our platform makes it easy to find work, hire experts, and collaborate securely.
            </p>
            <div className="flex space-x-4">
              <a href="#" className="text-gray-400 hover:text-white">
                <i className="fab fa-facebook-f"></i>
              </a>
              <a href="#" className="text-gray-400 hover:text-white">
                <i className="fab fa-twitter"></i>
              </a>
              <a href="#" className="text-gray-400 hover:text-white">
                <i className="fab fa-linkedin-in"></i>
              </a>
              <a href="#" className="text-gray-400 hover:text-white">
                <i className="fab fa-instagram"></i>
              </a>
            </div>
          </div>
          
          <div>
            <h3 className="text-lg font-semibold mb-4">Resources</h3>
            <ul className="space-y-2">
              <li><Link href="/documentation" className="text-gray-400 hover:text-white">Documentation</Link></li>
              <li><Link href="/how-to-hire" className="text-gray-400 hover:text-white">How to Hire</Link></li>
              <li><Link href="/jobs" className="text-gray-400 hover:text-white">Talent Marketplace</Link></li>
              <li><Link href="/payment-protection" className="text-gray-400 hover:text-white">Payment Protection</Link></li>
              <li><Link href="/enterprise" className="text-gray-400 hover:text-white">Enterprise Solutions</Link></li>
              <li><Link href="/success-stories" className="text-gray-400 hover:text-white">Success Stories</Link></li>
            </ul>
          </div>
          
          <div>
            <h3 className="text-lg font-semibold mb-4">For Freelancers</h3>
            <ul className="space-y-2">
              <li><Link href="/jobs" className="text-gray-400 hover:text-white">Find Work</Link></li>
              <li><Link href="/profile" className="text-gray-400 hover:text-white">Create Profile</Link></li>
              <li><Link href="/skills-tests" className="text-gray-400 hover:text-white">Skills Tests</Link></li>
              <li><Link href="/payments" className="text-gray-400 hover:text-white">Get Paid</Link></li>
              <li><Link href="/community" className="text-gray-400 hover:text-white">Community</Link></li>
            </ul>
          </div>
          
          <div>
            <h3 className="text-lg font-semibold mb-4">Resources</h3>
            <ul className="space-y-2">
              <li><Link href="/help" className="text-gray-400 hover:text-white">Help & Support</Link></li>
              <li><Link href="/blog" className="text-gray-400 hover:text-white">Blog</Link></li>
              <li><Link href="/trust-safety" className="text-gray-400 hover:text-white">Trust & Safety</Link></li>
              <li><Link href="/terms" className="text-gray-400 hover:text-white">Terms of Service</Link></li>
              <li><Link href="/privacy" className="text-gray-400 hover:text-white">Privacy Policy</Link></li>
            </ul>
          </div>
        </div>
        
        <div className="border-t border-gray-700 mt-12 pt-8 text-center text-gray-400 text-sm">
          <p>&copy; {new Date().getFullYear()} FreelanceHub. All rights reserved.</p>
        </div>
      </div>
    </footer>
  );
}
