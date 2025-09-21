import React from 'react'
import { Toaster } from "@/components/ui/toaster"
import { Toaster as Sonner } from "@/components/ui/sonner"
import { QueryClient, QueryClientProvider, useQuery } from "@tanstack/react-query"
import { BrowserRouter, Routes, Route, useLocation } from "react-router-dom"
import { supabase } from "@/integrations/supabase/client"
import { AuthProvider } from "@/contexts/AuthContext"
import { ThemeProvider } from "@/components/ThemeProvider"
import { PageTransition } from "@/components/PageTransition"
import { AIChatbot } from "@/components/AIChatbot"
import { Layout } from "@/components/Layout"
import Index from "./pages/Index"
import Auth from "./pages/Auth"
import EmailConfirmation from "./pages/EmailConfirmation"
import Experiences from "./pages/Experiences"
import ExperienceDetail from "./pages/ExperienceDetail"
import Destinations from "./pages/Destinations"
import DestinationDetail from "./pages/DestinationDetail"
import SearchResults from "./pages/SearchResults"
import Favorites from "./pages/Favorites"
import Profile from "./pages/Profile"
import Bookings from "./pages/Bookings"
import CreateExperience from "./pages/CreateExperience"
import EditExperience from "./pages/EditExperience"
import ContactUs from "./pages/ContactUs"
import OurStory from "./pages/OurStory"
import TermsAndConditions from "./pages/TermsAndConditions"
import NotFound from "./pages/NotFound"
import ComingSoon from "./pages/ComingSoon"
import Partner from "./pages/Partner"
import VendorExperiences from "./pages/VendorExperiences"
import "./App.css"
import { MobileFloatingButton } from './components/MobileFloatingButton'

const queryClient = new QueryClient()

// Component to conditionally render AIChatbot only on homepage
const ConditionalAIChatbot = () => {
  const location = useLocation()
  const isHomepage = location.pathname === '/'

  if (!isHomepage) {
    return null
  }

  return <AIChatbot />
}

// Component to conditionally render MobileFloatingButton based on route
const ConditionalMobileButton = () => {
  const location = useLocation()
  const isExperienceDetailRoute = location.pathname.startsWith('/experience/')

  if (!isExperienceDetailRoute) {
    return null
  }

  // Extract experience ID from URL
  const experienceId = location.pathname.split('/experience/')[1]
  
  // Get experience data using React Query
  const { data: experience } = useQuery({
    queryKey: ["experience", experienceId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("experiences")
        .select("*")
        .eq("id", experienceId)
        .single();

      if (error) throw error;
      return data;
    },
    enabled: !!experienceId,
  });

  // Get activities data to check for discounted prices
  const { data: activities } = useQuery({
    queryKey: ["activities", experienceId],
    queryFn: async () => {
      if (!experienceId) return [];
      const { data, error } = await supabase
        .from("activities")
        .select("*")
        .eq("experience_id", experienceId)
        .eq("is_active", true);

      if (error) throw error;
      return data || [];
    },
    enabled: !!experienceId,
  });

  // Get the first activity's discounted price (assuming single activity for mobile button)
  const firstActivity = activities?.[0];
  const discountedPrice = (firstActivity as any)?.discounted_price;

  // Don't render if no experience data
  if (!experience) {
    return null
  }

  return (
    <MobileFloatingButton
      price={firstActivity?.price || experience.price || 0}
      originalPrice={experience.original_price}
      currency={experience.currency || "INR"}
      bookingButtonText="Book Now"
      discountedPrice={discountedPrice}
      onBookingClick={() => {
        // Dispatch custom event to open booking dialog
        window.dispatchEvent(new CustomEvent('openBookingDialog'))
      }}
    />
  )
}

const App: React.FC = () => {
  return (
    <QueryClientProvider client={queryClient}>
      <ThemeProvider defaultTheme="light" storageKey="bucketlistt-ui-theme">
        <AuthProvider>
          <Toaster />
          <Sonner />
          <BrowserRouter>
            <Layout>
              <PageTransition>
                <Routes>
                  <Route path="/" element={<Index />} />
                  <Route path="/auth" element={<Auth />} />
                  <Route path="/email-confirmation" element={<EmailConfirmation />} />
                  <Route path="/experiences" element={<Experiences />} />
                  <Route path="/destinations" element={<Destinations />} />
                  <Route path="/favorites" element={<Favorites />} />
                  <Route path="/profile" element={<Profile />} />
                  <Route path="/bookings" element={<Bookings />} />
                  <Route path="/create-experience" element={<CreateExperience />} />
                  <Route path="/edit-experience/:id" element={<EditExperience />} />
                  <Route path="/contact" element={<ContactUs />} />
                  <Route path="/our-story" element={<OurStory />} />
                  <Route path="/terms" element={<TermsAndConditions />} />
                  <Route path="/search" element={<SearchResults />} />
                  <Route path="/coming-soon" element={<ComingSoon />} />
                  <Route path="/partner" element={<Partner />} />
                  <Route path="/vendor/experiences" element={<VendorExperiences />} />
                  <Route path="/experience/:id" element={<ExperienceDetail />} />
                  <Route path="/destination/:id" element={<DestinationDetail />} />
                  <Route path="*" element={<NotFound />} />
                </Routes>
              </PageTransition>
            </Layout>

            {/* AI Chatbot - Only show on homepage */}
            <ConditionalAIChatbot />
            {/* Mobile Floating Button - Only show on experience detail routes */}
            <ConditionalMobileButton />
          </BrowserRouter>
        </AuthProvider>
      </ThemeProvider>
    </QueryClientProvider>
  )
}

export default App