import React from 'react'
import { Toaster } from "@/components/ui/toaster"
import { Toaster as Sonner } from "@/components/ui/sonner"
import { QueryClient, QueryClientProvider } from "@tanstack/react-query"
import { BrowserRouter, Routes, Route } from "react-router-dom"
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

const queryClient = new QueryClient()

const App: React.FC = () => {
  return (
    <QueryClientProvider client={queryClient}>
      <ThemeProvider defaultTheme="dark" storageKey="bucketlistt-ui-theme">
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
          </BrowserRouter>

          {/* AI Chatbot - Fixed position on all pages */}
          <AIChatbot />
        </AuthProvider>
      </ThemeProvider>
    </QueryClientProvider>
  )
}

export default App