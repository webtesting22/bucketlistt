import { useAuth } from "@/contexts/AuthContext"
import { supabase } from "@/integrations/supabase/client"
import { useQuery } from "@tanstack/react-query"
import { format } from 'date-fns'
import { Calendar, Clock, CreditCard, MapPin, Users } from 'lucide-react'

type Participant = {
  booking_id: string | number
  name?: string
  email?: string
  phone_number?: string
}

type TimeSlots = {
  start_time?: string
  end_time?: string
}

type Experience = {
  id?: string | number
  title?: string
  image_url?: string
  location?: string
  price?: number
  currency?: string
  vendor_id?: string | null
}

type Booking = {
  id?: string | number
  booking_date?: string
  time_slots?: TimeSlots
  total_participants?: number
  experiences?: Experience
  booking_participants?: Participant[]
  status?: string
  created_at?: string
}

const TotalBookings = () => {
  const { user } = useAuth()

  const { data: bookings, isLoading } = useQuery({
    queryKey: ['vendor-total-bookings', user?.id],
    queryFn: async () => {
      if (!user) return []

      // Fetch bookings for experiences owned by this vendor
      const { data: bookingsData, error } = await supabase
        .from('bookings')
        .select(`
          *,
          experiences ( id, title, image_url, location, price, currency, vendor_id ),
          time_slots ( start_time, end_time )
        `)
        .order('created_at', { ascending: false })

      if (error) throw error

      const allBookings = (bookingsData || []) as Booking[]

      // Filter bookings to experiences owned by this vendor
      const vendorBookings = allBookings.filter((b) => b.experiences?.vendor_id === user.id)

      // Fetch participants for these bookings and attach
  const bookingIds = vendorBookings.map((b) => b.id).filter(Boolean) as Array<string>
      if (bookingIds.length === 0) return vendorBookings

      const { data: participantsData, error: participantsError } = await supabase
        .from('booking_participants')
        .select('booking_id, name, email, phone_number')
        .in('booking_id', bookingIds)

      if (participantsError) throw participantsError

      const participantsByBooking: Record<string, Array<Record<string, unknown>>> = {}
      ;(participantsData || []).forEach((p: Participant) => {
        const key = (typeof p.booking_id === 'string' || typeof p.booking_id === 'number') ? String(p.booking_id) : ''
        if (!participantsByBooking[key]) participantsByBooking[key] = []
        participantsByBooking[key].push(p)
      })

      return vendorBookings.map((b) => {
        const key = (typeof b.id === 'string' || typeof b.id === 'number') ? String(b.id) : ''
        return {
          ...b,
          booking_participants: participantsByBooking[key] || []
        } as Booking
      })
    },
    enabled: !!user
  })

  if (isLoading) return <div className="p-4">Loading...</div>

  if (!bookings || bookings.length === 0) return <div className="p-4">No bookings yet</div>

  const bookingsList = bookings

  return (
    <div className="p-4">
      <div className="bg-card rounded-lg border shadow-sm overflow-hidden">
        <div className="bg-muted/50 px-6 py-4 border-b">
          <div className="grid grid-cols-12 gap-4 text-sm font-medium text-muted-foreground text-left">
            <div className="col-span-2">Experience</div>
            <div className="col-span-2">Date & Time</div>
            <div className="col-span-2">Participants</div>
            <div className="col-span-2">Contact</div>
            <div className="col-span-2">Amount</div>
            <div className="col-span-1">Status</div>
            <div className="col-span-1">Booked On</div>
          </div>
        </div>
        <div className="divide-y divide-border">
          {bookingsList.map((booking: Booking) => (
            <div key={String(booking.id)} className="px-6 py-4 hover:bg-muted/30 transition-colors">
              <div className="grid grid-cols-12 gap-4 items-center text-left">
                <div className="col-span-2">
                  <div className="flex items-center gap-2">
                    <div className="w-10 h-10 rounded-lg overflow-hidden bg-muted flex-shrink-0">
                      {booking.experiences?.image_url ? (
                        <img src={booking.experiences?.image_url} alt={(booking.experiences?.title) || ''} className="w-full h-full object-cover" />
                      ) : (
                        <div className="w-full h-full bg-gradient-to-br from-orange-400 to-red-500 flex items-center justify-center">
                          <MapPin className="h-5 w-5 text-white" />
                        </div>
                      )}
                    </div>
                    <div className="min-w-0 flex-1">
                      <h4 className="font-medium text-xs truncate">{booking.experiences?.title}</h4>
                    </div>
                  </div>
                </div>

                <div className="col-span-2">
                  <div className="flex items-center gap-1 text-sm">
                    <Calendar className="h-4 w-4 text-muted-foreground" />
                    <span>{format(new Date(String(booking.booking_date)), 'MMM d')}</span>
                  </div>
                  {booking.time_slots && (
                    <div className="flex items-center gap-1 text-xs text-muted-foreground mt-1">
                      <Clock className="h-3 w-3" />
                      <span>{format(new Date(`2000-01-01T${String(booking.time_slots?.start_time)}`), 'h:mm a')}</span>
                    </div>
                  )}
                </div>

                <div className="col-span-2">
                  <div className="flex items-center gap-1 text-sm mb-1">
                    <Users className="h-4 w-4 text-muted-foreground" />
                    <span className="font-medium">{booking.total_participants}</span>
                  </div>
                  <div className="text-xs text-muted-foreground">
                    {booking.booking_participants?.[0]?.name && (
                      <div className="truncate">{booking.booking_participants[0].name}</div>
                    )}
                    {booking.booking_participants && booking.booking_participants.length > 1 && (
                      <div className="text-xs text-muted-foreground">+{booking.booking_participants.length - 1} more</div>
                    )}
                  </div>
                </div>

                <div className="col-span-2">
                  {booking.booking_participants?.[0] && (
                    <div className="text-xs">
                      <div className="truncate font-medium">{booking.booking_participants[0].email}</div>
                      {booking.booking_participants[0].phone_number && (
                        <div className="truncate text-muted-foreground mt-1">{booking.booking_participants[0].phone_number}</div>
                      )}
                    </div>
                  )}
                </div>

                <div className="col-span-2">
                  <div className="flex items-center gap-1 text-sm font-semibold text-orange-600">
                    <CreditCard className="h-4 w-4" />
                    <span>{booking.experiences?.currency === 'USD' ? '₹' : booking.experiences?.currency} {((Number(booking.experiences?.price || 0) * Number(booking.total_participants || 0))).toLocaleString()}</span>
                  </div>
                  <div className="text-xs text-muted-foreground">{booking.total_participants} × {booking.experiences?.currency === 'USD' ? '₹' : booking.experiences?.currency}{String(booking.experiences?.price ?? '')}</div>
                </div>

                <div className="col-span-1">
                  <div className="text-xs">
                    {booking.status ? (booking.status.charAt(0).toUpperCase() + booking.status.slice(1)) : ''}
                  </div>
                </div>

                <div className="col-span-1">
                  <div className="text-xs text-muted-foreground">{format(new Date(String(booking.created_at)), 'MMM d')}</div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}

export default TotalBookings