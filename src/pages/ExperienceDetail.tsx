
import { useParams, useNavigate } from "react-router-dom"
import { useQuery } from "@tanstack/react-query"
import { supabase } from "@/integrations/supabase/client"
import { Header } from "@/components/Header"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { ImageGallery } from "@/components/ImageGallery"
import { BookingDialog } from "@/components/BookingDialog"
import { BookingSuccessAnimation } from "@/components/BookingSuccessAnimation"
import { UserBookings } from "@/components/UserBookings"
import { RecentBookingsTable } from "@/components/RecentBookingsTable"
import { useAuth } from "@/contexts/AuthContext"
import { ArrowLeft, Star, Clock, Users, MapPin, Calendar, Route } from "lucide-react"
import { useState, useRef } from "react"
// import { saveAs } from "file-saver"
import { useUserRole } from "@/hooks/useUserRole"
import { BulkBookingPaymentDialog } from "@/components/BulkBookingPaymentDialog"
import { ExperienceVendorAnalytics } from "@/components/ExperienceVendorAnalytics"
import { CertificationBadges } from "@/components/CertificationBadges"
import "../Styles/ExperienceDetail.css"
const ExperienceDetail = () => {
  const { id } = useParams()
  const navigate = useNavigate()
  const { user } = useAuth()
  const { isVendor, loading: roleLoading } = useUserRole()
  const [isBookingDialogOpen, setIsBookingDialogOpen] = useState(false)
  const [showSuccessAnimation, setShowSuccessAnimation] = useState(false)
  const [isBulkPaymentDialogOpen, setIsBulkPaymentDialogOpen] = useState(false)
  const [bulkBookingsData, setBulkBookingsData] = useState([])
  const [bulkParticipantsData, setBulkParticipantsData] = useState([])

  const { data: experience, isLoading, error } = useQuery({
    queryKey: ['experience', id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('experiences')
        .select('*')
        .eq('id', id)
        .single()

      if (error) throw error
      return data
    },
    enabled: !!id
  })

  const { data: images } = useQuery({
    queryKey: ['experience-images', id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('experience_images')
        .select('*')
        .eq('experience_id', id)
        .order('display_order')

      if (error) throw error
      return data || []
    },
    enabled: !!id
  })

  const { data: userBookings, refetch: refetchBookings } = useQuery({
    queryKey: ['user-experience-bookings', user?.id, id],
    queryFn: async () => {
      if (!user || !id) return []

      const { data, error } = await supabase
        .from('bookings')
        .select(`
          *,
          booking_participants (
            name,
            email,
            phone_number
          )
        `)
        .eq('user_id', user.id)
        .eq('experience_id', id)
        .order('created_at', { ascending: false })

      if (error) throw error
      return data || []
    },
    enabled: !!user && !!id
  })

  const getDistanceDisplay = () => {
    if (experience?.distance_km === 0) return "On spot experience"
    if (experience?.distance_km && experience?.start_point && experience?.end_point) {
      return `${experience.distance_km}km journey starting from ${experience.start_point} to ${experience.end_point}`
    }
    if (experience?.distance_km) return `${experience.distance_km}km route`
    return null
  }

  const handleBookingSuccess = () => {
    setShowSuccessAnimation(true)
    refetchBookings()
  }

  const handleAnimationComplete = () => {
    setShowSuccessAnimation(false)
  }

  const handleBulkPaymentSuccess = () => {
    setShowSuccessAnimation(true)
    refetchBookings()
    setBulkBookingsData([])
    setBulkParticipantsData([])
  }

  const hasExistingBookings = userBookings && userBookings.length > 0
  const bookingButtonText = hasExistingBookings ? "Book Another" : "Book Now"

  // Combine main image with gallery images, prioritizing gallery images
  const galleryImages = images && images.length > 0
    ? images
    : experience?.image_url
      ? [{
        id: 'main',
        image_url: experience.image_url,
        alt_text: experience.title,
        display_order: 0,
        is_primary: true
      }]
      : []

  // Bulk Booking CSV Download
  const handleDownloadBulkBookingCSV = () => {
    // Simplified columns - removed total_participants as it's always 1
    const columns = [
      'booking_date (YYYY-MM-DD)',
      'note_for_guide',
      'participant_name',
      'participant_email',
      'participant_phone_number'
    ]
    const csvContent = columns.join(',') + '\n' + '2024-01-15,Sample note,John Doe,john@example.com,+1234567890\n'
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' })
    // Use file-saver if available, else fallback
    if (window.navigator && window.navigator.msSaveOrOpenBlob) {
      window.navigator.msSaveOrOpenBlob(blob, 'bulk_booking_template.csv')
    } else {
      const link = document.createElement('a')
      link.href = URL.createObjectURL(blob)
      link.setAttribute('download', 'bulk_booking_template.csv')
      document.body.appendChild(link)
      link.click()
      document.body.removeChild(link)
    }
  }

  // Bulk Booking CSV Upload
  const fileInputRef = useRef(null)
  const handleBulkUploadClick = () => {
    if (fileInputRef.current) {
      fileInputRef.current.value = '' // reset file input
      fileInputRef.current.click()
    }
  }
  const handleBulkUploadFile = async (e) => {
    const file = e.target.files[0]
    if (!file) return

    try {
      const text = await file.text()
      const lines = text.split('\n').filter(line => line.trim())

      if (lines.length < 2) {
        alert('CSV file must contain at least a header and one data row')
        return
      }

      // Skip header row and parse data rows
      const dataRows = lines.slice(1)
      const bookingsToInsert = []
      const participantsToInsert = []
      const errors = []

      for (let i = 0; i < dataRows.length; i++) {
        const line = dataRows[i]
        const [bookingDate, noteForGuide, participantName, participantEmail, participantPhone] = line.split(',').map(field => field.trim())

        if (!bookingDate || !participantName || !participantEmail) {
          errors.push(`Row ${i + 2}: Missing required fields (booking_date, participant_name, participant_email)`)
          continue
        }

        // Check for available time slots for this date
        const { data: timeSlots, error: slotsError } = await supabase
          .from('time_slots')
          .select('*')
          .eq('experience_id', id)
          .order('start_time')

        if (slotsError) {
          errors.push(`Row ${i + 2}: Error fetching time slots - ${slotsError.message}`)
          continue
        }

        if (!timeSlots || timeSlots.length === 0) {
          errors.push(`Row ${i + 2}: No time slots available for this experience`)
          continue
        }

        // Check existing bookings for this date to find available slots
        const { data: existingBookings, error: bookingsError } = await supabase
          .from('bookings')
          .select('time_slot_id, total_participants')
          .eq('experience_id', id)
          .eq('booking_date', bookingDate)

        if (bookingsError) {
          errors.push(`Row ${i + 2}: Error checking existing bookings - ${bookingsError.message}`)
          continue
        }

        // Find an available time slot
        let availableSlot = null
        for (const slot of timeSlots) {
          const slotBookings = existingBookings?.filter(booking => booking.time_slot_id === slot.id) || []
          const bookedCount = slotBookings.reduce((sum, booking) => sum + booking.total_participants, 0)
          const availableSpots = slot.capacity - bookedCount

          if (availableSpots >= 1) {
            availableSlot = slot
            break
          }
        }

        if (!availableSlot) {
          errors.push(`Row ${i + 2}: No available time slots for ${participantName} on ${bookingDate}`)
          continue
        }

        // Generate a unique booking ID
        const bookingId = crypto.randomUUID()

        // Create booking record with time slot
        bookingsToInsert.push({
          id: bookingId,
          user_id: user.id,
          experience_id: id,
          booking_date: bookingDate,
          time_slot_id: availableSlot.id,
          total_participants: 1, // Always 1 as specified
          note_for_guide: noteForGuide || null,
          status: 'confirmed',
          created_at: new Date().toISOString()
        })

        // Create participant record
        participantsToInsert.push({
          booking_id: bookingId,
          name: participantName,
          email: participantEmail,
          phone_number: participantPhone || null
        })
      }

      // Show errors if any
      if (errors.length > 0) {
        alert('Some bookings could not be created:\n\n' + errors.join('\n'))
        if (bookingsToInsert.length === 0) {
          return
        }
      }

      if (bookingsToInsert.length === 0) {
        alert('No valid bookings to create')
        return
      }

      // Store the booking data and show payment dialog
      setBulkBookingsData(bookingsToInsert)
      setBulkParticipantsData(participantsToInsert)
      setIsBulkPaymentDialogOpen(true)

    } catch (error) {
      console.error('Error processing CSV:', error)
      alert('Error processing CSV file: ' + error.message)
    }
  }

  if (roleLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">Loading...</div>
      </div>
    )
  }

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background">
        <Header />
        <div className="container py-16 px-4">
          <div className="text-center">Loading...</div>
        </div>
      </div>
    )
  }

  if (error || !experience) {
    return (
      <div className="min-h-screen bg-background">
        <Header />
        <div className="container py-16 px-4">
          <div className="text-center">Experience not found</div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-background">
      <Header />

      <div className="container py-8 px-4">
        {/* <Button 
          variant="ghost" 
          onClick={() => navigate('/')}
          className="mb-6 hover:bg-accent"
        >
          <ArrowLeft className="mr-2 h-4 w-4" />
          Back to Homefsa
        </Button> */}

        <div >
          {/* Image Gallery Section */}
          <ImageGallery
            images={galleryImages}
            experienceTitle={experience.title}
          />

          {/* Details Section */}
          <div className="space-y-6 container PaddingSectionTop">
            <div>
              <div className="flex items-center gap-2 text-sm text-muted-foreground mb-2">
                <span>{experience.category}</span>
                {experience.location && (
                  <>
                    <span>•</span>
                    <MapPin className="h-4 w-4" />
                    <span>{experience.location}</span>
                  </>
                )}
              </div>

              <h1 className="text-3xl font-bold mb-4">{experience.title}</h1>

              {experience.is_special_offer && (
                <Badge className="mb-4 bg-orange-500 hover:bg-orange-600">
                  Special Offer
                </Badge>
              )}

              <div className="flex items-center gap-4 mb-4">
                <div className="flex items-center gap-1">
                  <Star className="h-5 w-5 fill-yellow-400 text-yellow-400" />
                  <span className="font-semibold">{experience.rating}</span>
                </div>
                <span className="text-muted-foreground">
                  ({experience.reviews_count?.toLocaleString()} reviews)
                </span>
              </div>

              <div className="flex items-center gap-6 text-sm text-muted-foreground mb-4">
                {experience.duration && (
                  <div className="flex items-center gap-1">
                    <Clock className="h-4 w-4" />
                    <span>{experience.duration}</span>
                  </div>
                )}
                {experience.group_size && (
                  <div className="flex items-center gap-1">
                    <Users className="h-4 w-4" />
                    <span>{experience.group_size}</span>
                  </div>
                )}
              </div>

              {getDistanceDisplay() && (
                <div className="flex items-center gap-2 text-sm text-muted-foreground mb-6 p-3 bg-muted rounded-lg">
                  {experience.distance_km === 0 ? (
                    <MapPin className="h-4 w-4 text-orange-500" />
                  ) : (
                    <Route className="h-4 w-4 text-orange-500" />
                  )}
                  <span className="font-medium">{getDistanceDisplay()}</span>
                </div>
              )}

              <div className="flex items-center gap-3 mb-6">
                <span className="text-3xl font-bold text-orange-500">
                  {experience.currency === 'USD' ? '₹' : experience.currency} {experience.price}
                </span>
                {experience.original_price && (
                  <span className="text-lg text-muted-foreground line-through">
                    {experience.currency === 'USD' ? '₹' : experience.currency} {experience.original_price}
                  </span>
                )}
              </div>

              <Button
                size="lg"
                className="w-full bg-orange-500 hover:bg-orange-600 text-white"
                onClick={() => setIsBookingDialogOpen(true)}
              >
                {bookingButtonText}
              </Button>

              {/* Bulk Booking Buttons for Vendor */}
              {isVendor && (
                <div className="flex flex-col gap-2 mt-2">
                  <Button
                    variant="outline"
                    className="w-full"
                    onClick={handleDownloadBulkBookingCSV}
                  >
                    Bulk Booking (Download CSV Template)
                  </Button>
                  <Button
                    variant="outline"
                    className="w-full"
                    onClick={handleBulkUploadClick}
                  >
                    Bulk Upload (Upload CSV)
                  </Button>
                  <input
                    type="file"
                    accept=".csv"
                    style={{ display: 'none' }}
                    ref={fileInputRef}
                    onChange={handleBulkUploadFile}
                  />
                </div>
              )}
            </div>

            {experience.description && (
              <div>
                <h2 className="text-xl font-semibold mb-3">About this experience</h2>
                <p className="text-muted-foreground leading-relaxed">
                  {experience.description}
                </p>
              </div>
            )}
          </div>
        </div>

        {/* Vendor Analytics Section - Only show if user is the vendor who created this experience */}
        {user && isVendor && experience.vendor_id === user.id && (
          <div className="mt-12">
            <div className="border-t pt-8">
              <ExperienceVendorAnalytics
                experienceId={experience.id}
                experienceTitle={experience.title}
                experiencePrice={experience.price || 0}
              />
            </div>
          </div>
        )}

        {/* Certification Badges */}
        <div className="mt-12">
          <div className="border-t pt-8">
            <CertificationBadges />
          </div>
        </div>

        {/* Recent Bookings for this Experience */}
        {user && (
          <div className="mt-12">
            <div className="border-t pt-8">
              <div className="flex items-center gap-3 mb-6">
                <Calendar className="h-5 w-5 text-orange-600" />
                <h2 className="text-2xl font-bold text-orange-800 dark:text-orange-200">
                  {isVendor && experience.vendor_id === user.id ? 'All Bookings for this Experience' : 'Your Bookings for this Experience'}
                </h2>
              </div>
              <RecentBookingsTable
                experienceId={id}
                limit={10}
                isVendorView={isVendor && experience.vendor_id === user.id}
              />
            </div>
          </div>
        )}

        {/* Booking Dialog */}
        <BookingDialog
          isOpen={isBookingDialogOpen}
          onClose={() => setIsBookingDialogOpen(false)}
          experience={{
            id: experience.id,
            title: experience.title,
            price: experience.price || 0,
            currency: experience.currency || 'INR'
          }}
          onBookingSuccess={handleBookingSuccess}
        />

        {/* Success Animation */}
        <BookingSuccessAnimation
          isVisible={showSuccessAnimation}
          onComplete={handleAnimationComplete}
        />

        {/* Bulk Booking Payment Dialog */}
        <BulkBookingPaymentDialog
          isOpen={isBulkPaymentDialogOpen}
          onClose={() => setIsBulkPaymentDialogOpen(false)}
          experience={{
            id: experience.id,
            title: experience.title,
            price: experience.price || 0,
            currency: experience.currency || 'INR'
          }}
          bookingsData={bulkBookingsData}
          participantsData={bulkParticipantsData}
          onPaymentSuccess={handleBulkPaymentSuccess}
        />
      </div>
    </div>
  )
}

export default ExperienceDetail
