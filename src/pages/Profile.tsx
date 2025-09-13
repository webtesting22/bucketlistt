
import { Header } from "@/components/Header"
import { useAuth } from "@/contexts/AuthContext"
import { useUserRole } from "@/hooks/useUserRole"
import { useNavigate } from "react-router-dom"
import { useEffect, useState } from "react"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { UserBookings } from "@/components/UserBookings"
import { VendorAnalytics } from "@/components/VendorAnalytics"
import { EditProfileDialog } from "@/components/EditProfileDialog"
import { supabase } from "@/integrations/supabase/client"
import { useQuery } from "@tanstack/react-query"
import { useIsMobile } from "@/hooks/use-mobile"
import { 
  Calendar, 
  Gift, 
  FileText, 
  CreditCard, 
  Settings, 
  User, 
  MapPin,
  ChevronRight,
  Star,
  Heart,
  Plus,
  BarChart3,
  Eye
} from "lucide-react"

const Profile = () => {
  const { user, loading } = useAuth()
  const { isVendor, loading: roleLoading } = useUserRole()
  const navigate = useNavigate()
  const [showEditProfile, setShowEditProfile] = useState(false)
  const [activeSection, setActiveSection] = useState('bookings') // Default to bookings initially
  const isMobile = useIsMobile()

  useEffect(() => {
    if (!loading && !user) {
      navigate('/auth')
    }
  }, [user, loading, navigate])

  // Update activeSection when isVendor changes
  useEffect(() => {
    if (!roleLoading) {
      setActiveSection(isVendor ? 'analytics' : 'bookings')
    }
  }, [isVendor, roleLoading])

  const { data: userProfile, isLoading: profileLoading, refetch: refetchProfile } = useQuery({
    queryKey: ['profile', user?.id],
    queryFn: async () => {
      if (!user?.id) return null
      
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', user.id)
        .single()

      if (error) {
        console.error('Error fetching profile:', error)
        return null
      }
      return data
    },
    enabled: !!user?.id
  })

  if (loading || roleLoading || profileLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">Loading...</div>
      </div>
    )
  }

  if (!user) {
    return null
  }

  const getInitials = (firstName: string, lastName: string) => {
    return `${firstName.charAt(0)}${lastName.charAt(0)}`.toUpperCase()
  }

  const getDisplayName = () => {
    if (userProfile?.first_name && userProfile?.last_name) {
      return `${userProfile.first_name} ${userProfile.last_name}`
    }
    return user.email || "User"
  }

  const sidebarItems = [
    ...(isVendor ? [
      { 
        id: 'analytics',
        icon: BarChart3, 
        title: "Analytics", 
        description: "View your business insights"
      },
      { 
        id: 'my-experiences',
        icon: Eye, 
        title: "My Experiences", 
        description: "Manage your experience listings"
      },
      { 
        id: 'create-experience',
        icon: Plus, 
        title: "Create Experience", 
        description: "Add new experiences"
      }
    ] : []),
    { 
      id: 'bookings',
      icon: Calendar, 
      title: "My Bookings", 
      description: "View your bookings"
    },
    { 
      id: 'rewards',
      icon: Gift, 
      title: "Rewards", 
      description: "Check your rewards and benefits",
      badge: "New"
    },
    { 
      id: 'promo-codes',
      icon: FileText, 
      title: "Promo codes", 
      description: "Your available discount codes",
      badge: "1"
    },
    { 
      id: 'payment-methods',
      icon: CreditCard, 
      title: "Payment methods", 
      description: "Manage your payment options"
    },
    { 
      id: 'wishlists',
      icon: Heart, 
      title: "Wishlists", 
      description: "Your saved experiences"
    },
    { 
      id: 'reviews',
      icon: Star, 
      title: "Reviews", 
      description: "Rate your experiences"
    },
    { 
      id: 'settings',
      icon: Settings, 
      title: "Settings", 
      description: "Account and app preferences"
    }
  ]

  const handleSectionClick = (sectionId: string) => {
    if (sectionId === 'wishlists') {
      navigate('/favorites')
      return
    }
    if (sectionId === 'create-experience') {
      navigate('/create-experience')
      return
    }
    if (sectionId === 'my-experiences') {
      navigate('/vendor/experiences')
      return
    }
    if (['rewards', 'promo-codes', 'payment-methods', 'reviews', 'settings'].includes(sectionId)) {
      navigate('/coming-soon')
      return
    }
    setActiveSection(sectionId)
  }

  const renderActiveSection = () => {
    switch (activeSection) {
      case 'analytics':
        return isVendor ? <VendorAnalytics /> : null
      case 'bookings':
        return <UserBookings />
      default:
        return null
    }
  }

  return (
    <div className="min-h-screen bg-background">
      <Header />
      
      <div className="container mx-auto px-3 sm:px-4 py-4 sm:py-8">
        <div className={`grid gap-4 sm:gap-6 lg:gap-8 ${isMobile ? 'grid-cols-1' : 'lg:grid-cols-4'}`}>
          {/* Left Sidebar - Profile + Navigation */}
          <div className={`${isMobile ? 'order-1' : 'lg:col-span-1'} space-y-4`}>
            {/* Profile Card */}
            <Card className="bg-gradient-to-br from-teal-400 to-blue-500 text-white">
              <CardContent className={`${isMobile ? 'p-4' : 'p-6'}`}>
                <div className={`text-center ${isMobile ? 'mb-4' : 'mb-6'}`}>
                  <Avatar className={`${isMobile ? 'h-16 w-16' : 'h-20 w-20'} mx-auto ${isMobile ? 'mb-3' : 'mb-4'} border-4 border-white/20`}>
                    <AvatarImage src={userProfile?.profile_picture_url || user.user_metadata?.avatar_url} alt={getDisplayName()} />
                    <AvatarFallback className={`text-teal-600 ${isMobile ? 'text-lg' : 'text-xl'} font-bold`}>
                      {userProfile?.first_name && userProfile?.last_name 
                        ? getInitials(userProfile.first_name, userProfile.last_name)
                        : (user.email?.substring(0, 2).toUpperCase() || "U")
                      }
                    </AvatarFallback>
                  </Avatar>
                  <h2 className={`${isMobile ? 'text-lg' : 'text-xl'} font-bold mb-1`}>{getDisplayName()}</h2>
                  <Button 
                    variant="ghost" 
                    className={`text-white hover:bg-white/20 ${isMobile ? 'text-xs' : 'text-sm'} ${isMobile ? 'px-3 py-1' : ''}`}
                    onClick={() => setShowEditProfile(true)}
                  >
                    Update personal info →
                  </Button>
                </div>

                <div className="bg-white/10 rounded-lg p-3 sm:p-4">
                  <div className={`flex items-center gap-2 sm:gap-3 ${isMobile ? 'mb-1' : 'mb-2'}`}>
                    <div className={`${isMobile ? 'w-6 h-6' : 'w-8 h-8'} bg-teal-600 rounded-full flex items-center justify-center`}>
                      <Gift className={`${isMobile ? 'h-3 w-3' : 'h-4 w-4'} text-white`} />
                    </div>
                    <div>
                      <Badge variant="secondary" className={`bg-teal-600 text-white ${isMobile ? 'text-xs' : ''}`}>
                        {isVendor ? "Vendor" : "Lv.1 Explorer"}
                      </Badge>
                    </div>
                  </div>
                  <p className={`${isMobile ? 'text-xs' : 'text-sm'} text-white/80`}>
                    {isVendor ? "Share amazing experiences" : "4 benefits, 1X rewards"}
                  </p>
                </div>
              </CardContent>
            </Card>

            {/* Navigation Menu */}
            <Card>
              <CardContent className="p-0">
                <div className="space-y-1">
                  {sidebarItems.map((item) => (
                    <button
                      key={item.id}
                      onClick={() => handleSectionClick(item.id)}
                      className={`w-full text-left p-3 hover:bg-muted/50 transition-colors flex items-center gap-3 ${
                        activeSection === item.id 
                          ? 'bg-orange-50 dark:bg-orange-950/20 border-r-2 border-orange-500' 
                          : ''
                      }`}
                    >
                      <div className={`w-8 h-8 rounded-full flex items-center justify-center ${
                        activeSection === item.id 
                          ? 'bg-orange-100 dark:bg-orange-950/30' 
                          : 'bg-gray-100 dark:bg-gray-800'
                      }`}>
                        <item.icon className={`h-4 w-4 ${
                          activeSection === item.id 
                            ? 'text-orange-600' 
                            : 'text-gray-600 dark:text-gray-300'
                        }`} />
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2">
                          <h4 className={`font-medium text-sm truncate ${
                            activeSection === item.id 
                              ? 'text-orange-800 dark:text-orange-200' 
                              : ''
                          }`}>
                            {item.title}
                          </h4>
                          {item.badge && (
                            <Badge 
                              variant={item.badge === "New" ? "destructive" : "secondary"} 
                              className="text-xs px-1.5 py-0.5"
                            >
                              {item.badge}
                            </Badge>
                          )}
                        </div>
                        <p className="text-xs text-muted-foreground truncate">
                          {item.description}
                        </p>
                      </div>
                    </button>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Right Content Area */}
          <div className={`${isMobile ? 'order-2' : 'lg:col-span-3'}`}>
            <Card className="min-h-[600px]">
              <CardContent className="p-6">
                {renderActiveSection()}
              </CardContent>
            </Card>
          </div>
        </div>
      </div>

      <EditProfileDialog 
        open={showEditProfile} 
        onOpenChange={setShowEditProfile}
        userProfile={userProfile}
        onProfileUpdate={refetchProfile}
      />
    </div>
  )
}

export default Profile
