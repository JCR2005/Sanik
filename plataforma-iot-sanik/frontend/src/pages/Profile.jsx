import Navbar from '../components/sanik/Navbar'
import useAuthStore from '../store/auth'
import { User, Building2, Mail } from 'lucide-react'

export default function Profile() {
  const { user, org } = useAuthStore()
  return (
    <div className="min-h-screen bg-[#0A0F0D]">
      <Navbar />
      <main className="max-w-2xl mx-auto px-4 py-8">
        <h1 className="text-white text-2xl font-bold mb-8">Perfil</h1>
        <div className="bg-[#121A16] border border-[#1E2E28] rounded-2xl p-6 space-y-4">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 bg-[#1D9E75]/20 rounded-xl flex items-center justify-center">
              <User size={22} className="text-[#1D9E75]" />
            </div>
            <div>
              <div className="text-white font-semibold">{user?.email}</div>
              <div className="text-[#8FA899] text-sm capitalize">{user?.role}</div>
            </div>
          </div>
          <hr className="border-[#1E2E28]" />
          <div className="flex items-center gap-3">
            <Building2 size={16} className="text-[#8FA899]" />
            <div>
              <div className="text-[#8FA899] text-xs">Organización</div>
              <div className="text-white text-sm">{org?.name}</div>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <Mail size={16} className="text-[#8FA899]" />
            <div>
              <div className="text-[#8FA899] text-xs">Plan actual</div>
              <div className="text-white text-sm capitalize">{org?.plan || 'free'}</div>
            </div>
          </div>
        </div>
      </main>
    </div>
  )
}
