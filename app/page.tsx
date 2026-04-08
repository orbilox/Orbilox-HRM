import Link from "next/link";
import { Building2, Users, Clock, Calendar, BarChart3, Shield, Zap, Globe, ChevronRight, Star, CheckCircle2 } from "lucide-react";
import { Button } from "@/components/ui/button";

const features = [
  { icon: Users, title: "Employee Management", desc: "Centralized employee database with complete profiles, org charts, and lifecycle management.", color: "bg-blue-100 text-blue-600" },
  { icon: Clock, title: "Attendance Tracking", desc: "Real-time check-in/out, shift management, overtime tracking and detailed reports.", color: "bg-green-100 text-green-600" },
  { icon: Calendar, title: "Leave Management", desc: "Automated leave workflows, balance tracking, team calendar and approval system.", color: "bg-purple-100 text-purple-600" },
  { icon: BarChart3, title: "Payroll Processing", desc: "Automated salary computation, payslip generation with PF, ESI, TDS calculations.", color: "bg-orange-100 text-orange-600" },
  { icon: Star, title: "Performance Reviews", desc: "Goal setting, 360° reviews, KPI tracking and continuous feedback loops.", color: "bg-yellow-100 text-yellow-600" },
  { icon: Globe, title: "Recruitment (ATS)", desc: "Job postings, candidate pipeline, interview scheduling and offer management.", color: "bg-pink-100 text-pink-600" },
  { icon: Shield, title: "Role-Based Access", desc: "Fine-grained permissions for Admin, HR, Manager and Employee roles.", color: "bg-indigo-100 text-indigo-600" },
  { icon: Zap, title: "Analytics & Reports", desc: "Visual dashboards, workforce analytics, and downloadable reports.", color: "bg-teal-100 text-teal-600" },
];

const stats = [
  { value: "500+", label: "Companies Trust Us" },
  { value: "50K+", label: "Employees Managed" },
  { value: "99.9%", label: "Uptime SLA" },
  { value: "4.9/5", label: "Customer Rating" },
];

const testimonials = [
  { name: "Priya Sharma", role: "HR Director, TechCorp", quote: "WorkNest transformed our HR processes. We reduced payroll processing time by 80%.", avatar: "PS" },
  { name: "Rahul Verma", role: "CEO, StartupXYZ", quote: "The best HR platform we've used. The attendance and leave management is seamless.", avatar: "RV" },
  { name: "Anita Patel", role: "Operations Manager, RetailCo", quote: "Onboarding new employees is now a breeze. WorkNest is simply outstanding.", avatar: "AP" },
];

export default function LandingPage() {
  return (
    <div className="min-h-screen bg-white">
      {/* Navbar */}
      <nav className="sticky top-0 z-50 bg-white/95 backdrop-blur border-b border-gray-100">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex items-center justify-between h-16">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center">
              <Building2 className="w-5 h-5 text-white" />
            </div>
            <span className="text-xl font-bold text-gray-900">WorkNest</span>
          </div>
          <div className="hidden md:flex items-center gap-8 text-sm text-gray-600">
            <a href="#features" className="hover:text-blue-600 transition-colors">Features</a>
            <a href="#pricing" className="hover:text-blue-600 transition-colors">Pricing</a>
            <a href="#testimonials" className="hover:text-blue-600 transition-colors">Reviews</a>
          </div>
          <div className="flex items-center gap-3">
            <Link href="/login">
              <Button variant="ghost" size="sm">Sign In</Button>
            </Link>
            <Link href="/login">
              <Button size="sm">Get Started Free</Button>
            </Link>
          </div>
        </div>
      </nav>

      {/* Hero */}
      <section className="relative bg-gradient-to-br from-blue-600 via-blue-700 to-indigo-800 text-white overflow-hidden">
        <div className="absolute inset-0 bg-[url('data:image/svg+xml,%3Csvg width=60 height=60 viewBox=0 0 60 60 xmlns=http://www.w3.org/2000/svg%3E%3Cg fill=none fill-rule=evenodd%3E%3Cg fill=%23ffffff fill-opacity=0.04%3E%3Cpath d=M36 34v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6 34v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6 4V0H4v4H0v2h4v4h2V6h4V4H6z/%3E%3C/g%3E%3C/g%3E%3C/svg%3E')] opacity-40" />
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20 lg:py-28 text-center relative">
          <div className="inline-flex items-center gap-2 bg-white/10 backdrop-blur px-4 py-1.5 rounded-full text-sm mb-6">
            <Zap className="w-4 h-4 text-yellow-300" />
            <span>India&apos;s smartest HRMS platform</span>
          </div>
          <h1 className="text-4xl sm:text-5xl lg:text-6xl font-bold mb-6 leading-tight">
            HR Management<br />
            <span className="text-yellow-300">Made Simple</span>
          </h1>
          <p className="text-xl text-blue-100 mb-10 max-w-2xl mx-auto">
            Everything your team needs — attendance, leaves, payroll, performance, and recruitment — in one powerful platform.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link href="/login">
              <Button size="lg" className="bg-white text-blue-700 hover:bg-blue-50 font-semibold px-8">
                Start for Free <ChevronRight className="w-4 h-4 ml-1" />
              </Button>
            </Link>
            <Link href="/login">
              <Button size="lg" variant="outline" className="border-white/30 text-white hover:bg-white/10 font-semibold px-8">
                View Demo
              </Button>
            </Link>
          </div>

          {/* Stats */}
          <div className="mt-16 grid grid-cols-2 sm:grid-cols-4 gap-6 max-w-3xl mx-auto">
            {stats.map((s) => (
              <div key={s.label} className="bg-white/10 backdrop-blur rounded-xl p-4">
                <div className="text-3xl font-bold text-yellow-300">{s.value}</div>
                <div className="text-sm text-blue-200 mt-1">{s.label}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Features */}
      <section id="features" className="py-20 bg-gray-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-14">
            <h2 className="text-3xl sm:text-4xl font-bold text-gray-900 mb-4">
              Everything you need to manage your workforce
            </h2>
            <p className="text-lg text-gray-500 max-w-xl mx-auto">
              WorkNest brings all HR operations together in one intuitive platform.
            </p>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {features.map((f) => (
              <div key={f.title} className="bg-white rounded-xl p-6 shadow-sm border border-gray-100 hover:shadow-md transition-shadow group">
                <div className={`w-12 h-12 rounded-lg flex items-center justify-center mb-4 ${f.color}`}>
                  <f.icon className="w-6 h-6" />
                </div>
                <h3 className="font-semibold text-gray-900 mb-2">{f.title}</h3>
                <p className="text-sm text-gray-500 leading-relaxed">{f.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Why WorkNest */}
      <section className="py-20 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid lg:grid-cols-2 gap-12 items-center">
            <div>
              <h2 className="text-3xl sm:text-4xl font-bold text-gray-900 mb-6">
                Why businesses choose <span className="text-blue-600">WorkNest</span>
              </h2>
              <div className="space-y-4">
                {[
                  "All-in-one platform — no more juggling multiple tools",
                  "Built for Indian compliance — PF, ESI, TDS, PT",
                  "Real-time analytics and workforce insights",
                  "Mobile-friendly — manage HR on the go",
                  "Secure, self-hosted — your data stays yours",
                  "Easy onboarding — get started in minutes",
                ].map((item) => (
                  <div key={item} className="flex items-start gap-3">
                    <CheckCircle2 className="w-5 h-5 text-green-500 mt-0.5 shrink-0" />
                    <span className="text-gray-700">{item}</span>
                  </div>
                ))}
              </div>
              <Link href="/login" className="inline-block mt-8">
                <Button size="lg">
                  Get Started <ChevronRight className="w-4 h-4 ml-1" />
                </Button>
              </Link>
            </div>
            <div className="grid grid-cols-2 gap-4">
              {[
                { label: "Leave Requests", value: "1,247", trend: "+12%", color: "bg-blue-600" },
                { label: "Payslips Generated", value: "3,890", trend: "+8%", color: "bg-green-600" },
                { label: "Employees Active", value: "248", trend: "+5%", color: "bg-purple-600" },
                { label: "Attendance Rate", value: "96.2%", trend: "+1.2%", color: "bg-orange-600" },
              ].map((card) => (
                <div key={card.label} className="bg-gray-50 rounded-xl p-5 border border-gray-100">
                  <div className={`text-xs font-medium px-2 py-1 rounded-full text-white inline-block mb-3 ${card.color}`}>
                    {card.trend}
                  </div>
                  <div className="text-2xl font-bold text-gray-900">{card.value}</div>
                  <div className="text-sm text-gray-500 mt-1">{card.label}</div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* Testimonials */}
      <section id="testimonials" className="py-20 bg-gray-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <h2 className="text-3xl font-bold text-gray-900 text-center mb-12">
            Trusted by HR teams across India
          </h2>
          <div className="grid sm:grid-cols-3 gap-6">
            {testimonials.map((t) => (
              <div key={t.name} className="bg-white rounded-xl p-6 shadow-sm border border-gray-100">
                <div className="flex items-center gap-1 mb-4">
                  {[...Array(5)].map((_, i) => (
                    <Star key={i} className="w-4 h-4 text-yellow-400 fill-yellow-400" />
                  ))}
                </div>
                <p className="text-gray-700 text-sm leading-relaxed mb-4">&quot;{t.quote}&quot;</p>
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-blue-600 flex items-center justify-center text-white text-sm font-bold">
                    {t.avatar}
                  </div>
                  <div>
                    <div className="font-semibold text-gray-900 text-sm">{t.name}</div>
                    <div className="text-xs text-gray-500">{t.role}</div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section id="pricing" className="py-20 bg-gradient-to-r from-blue-600 to-indigo-700 text-white">
        <div className="max-w-3xl mx-auto px-4 text-center">
          <h2 className="text-3xl sm:text-4xl font-bold mb-4">Ready to transform your HR?</h2>
          <p className="text-blue-100 text-lg mb-8">
            Join hundreds of companies managing their workforce with WorkNest. 100% free, self-hosted.
          </p>
          <Link href="/login">
            <Button size="lg" className="bg-white text-blue-700 hover:bg-blue-50 font-semibold px-10">
              Access WorkNest <ChevronRight className="w-4 h-4 ml-1" />
            </Button>
          </Link>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-gray-900 text-gray-400">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
          <div className="grid sm:grid-cols-4 gap-8 mb-10">
            <div>
              <div className="flex items-center gap-2 mb-4">
                <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center">
                  <Building2 className="w-5 h-5 text-white" />
                </div>
                <span className="text-white font-bold text-lg">WorkNest</span>
              </div>
              <p className="text-sm leading-relaxed">
                India&apos;s most complete HRMS platform for modern businesses of all sizes.
              </p>
            </div>
            <div>
              <h4 className="text-white font-semibold mb-4">Product</h4>
              <ul className="space-y-2 text-sm">
                <li><a href="#features" className="hover:text-white transition-colors">Features</a></li>
                <li><a href="#pricing" className="hover:text-white transition-colors">Pricing</a></li>
                <li><a href="#testimonials" className="hover:text-white transition-colors">Reviews</a></li>
              </ul>
            </div>
            <div>
              <h4 className="text-white font-semibold mb-4">Modules</h4>
              <ul className="space-y-2 text-sm">
                <li><a href="#features" className="hover:text-white transition-colors">Attendance</a></li>
                <li><a href="#features" className="hover:text-white transition-colors">Payroll</a></li>
                <li><a href="#features" className="hover:text-white transition-colors">Recruitment</a></li>
                <li><a href="#features" className="hover:text-white transition-colors">Performance</a></li>
              </ul>
            </div>
            <div>
              <h4 className="text-white font-semibold mb-4">Company</h4>
              <ul className="space-y-2 text-sm">
                <li><span className="text-gray-400">About Us</span></li>
                <li><span className="text-gray-400">Contact</span></li>
                <li><span className="text-gray-400">Privacy Policy</span></li>
                <li>
                  {/* LOGIN LINK IN FOOTER */}
                  <Link href="/login" className="text-blue-400 hover:text-blue-300 font-medium transition-colors">
                    Employee Login →
                  </Link>
                </li>
              </ul>
            </div>
          </div>
          <div className="border-t border-gray-800 pt-8 flex flex-col sm:flex-row items-center justify-between gap-4">
            <p className="text-sm">© 2025 WorkNest HRMS. All rights reserved.</p>
            <div className="flex items-center gap-4">
              <Link href="/login">
                <Button size="sm" variant="outline" className="border-gray-700 text-gray-300 hover:bg-gray-800 hover:text-white">
                  Sign In to WorkNest
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}
