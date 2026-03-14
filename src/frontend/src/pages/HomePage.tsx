import { useNavigate } from "@tanstack/react-router";

export default function HomePage() {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-white flex flex-col">
      {/* Header */}
      <header className="flex items-center justify-between px-8 py-4 border-b border-gray-200 bg-white/80 backdrop-blur">
        <div className="flex items-center gap-3">
          <img
            src="/assets/uploads/WhatsApp-Image-2026-02-27-at-11.18.04-AM-1-1.jpeg"
            alt="Infinexy Logo"
            className="h-12 w-12 object-contain rounded"
          />
          <span className="text-lg font-semibold text-[#1a2c6b]">Infinexy</span>
        </div>
        <button
          type="button"
          data-ocid="header.admin_portal.button"
          onClick={() => navigate({ to: "/admin/login" })}
          className="px-5 py-2 rounded-lg border border-blue-300 text-blue-700 bg-blue-50 hover:bg-blue-100 font-medium text-sm transition"
        >
          Admin Portal
        </button>
      </header>

      {/* Hero */}
      <main className="flex-1 flex flex-col items-start justify-center px-10 md:px-20 py-16 max-w-3xl">
        <span className="inline-flex items-center gap-2 text-sm text-blue-600 border border-blue-200 bg-blue-50 rounded-full px-4 py-1 mb-8">
          <span className="w-2 h-2 rounded-full bg-blue-500 inline-block" />
          Employee Registration Portal
        </span>

        <h1 className="text-5xl md:text-6xl font-bold text-[#1a2c6b] leading-tight mb-2">
          Infinexy
        </h1>
        <h2 className="text-4xl md:text-5xl font-bold text-blue-300 leading-tight mb-6">
          Finance
        </h2>

        <p className="text-gray-600 text-lg mb-3">
          A trusted name in financial services.
        </p>
        <p className="text-gray-500 mb-10">
          Use this portal to manage your team.
        </p>

        <button
          type="button"
          data-ocid="hero.register.primary_button"
          onClick={() => navigate({ to: "/register" })}
          className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white font-semibold px-8 py-4 rounded-xl text-lg transition shadow-lg"
        >
          Register as Employee
          <span className="text-xl">&rarr;</span>
        </button>
      </main>

      {/* Stats */}
      <section className="border-t border-gray-200 bg-white py-8 px-8">
        <div className="max-w-4xl mx-auto grid grid-cols-2 md:grid-cols-4 gap-6 text-center">
          <div>
            <div className="text-3xl font-bold text-gray-900">10+</div>
            <div className="text-gray-500 text-sm mt-1">Loan Products</div>
          </div>
          <div>
            <div className="text-3xl font-bold text-gray-900">3</div>
            <div className="text-gray-500 text-sm mt-1">Employee Roles</div>
          </div>
          <div>
            <div className="text-3xl font-bold text-gray-900">5+</div>
            <div className="text-gray-500 text-sm mt-1">Years Experience</div>
          </div>
          <div>
            <div className="text-3xl font-bold text-gray-900">98%</div>
            <div className="text-gray-500 text-sm mt-1">
              Client Satisfaction
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
