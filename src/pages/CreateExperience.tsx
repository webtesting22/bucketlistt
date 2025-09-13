
import { Header } from "@/components/Header"
import { useAuth } from "@/contexts/AuthContext"
import { useUserRole } from "@/hooks/useUserRole"
import { useNavigate } from "react-router-dom"
import { useEffect } from "react"
import { CreateExperienceForm } from "@/components/CreateExperienceForm"

const CreateExperience = () => {
  const { user, loading: authLoading } = useAuth()
  const { isVendor, loading: roleLoading } = useUserRole()
  const navigate = useNavigate()

  useEffect(() => {
    if (!authLoading && !roleLoading) {
      if (!user) {
        navigate('/auth')
      } else if (!isVendor) {
        navigate('/profile')
      }
    }
  }, [user, isVendor, authLoading, roleLoading, navigate])

  if (authLoading || roleLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">Loading...</div>
      </div>
    )
  }

  if (!user || !isVendor) {
    return null
  }

  return (
    <div className="min-h-screen bg-background">
      <Header />
      
      <div className="container mx-auto px-4 py-8">
        <CreateExperienceForm />
      </div>
    </div>
  )
}

export default CreateExperience
