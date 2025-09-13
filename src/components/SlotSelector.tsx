
import React, { useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { supabase } from '@/integrations/supabase/client'
import { Calendar } from '@/components/ui/calendar'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Label } from '@/components/ui/label'
import { Clock, Users } from 'lucide-react'
import { format } from 'date-fns'

interface SlotSelectorProps {
  experienceId: string
  selectedDate: Date | undefined
  selectedSlotId: string | undefined
  participantCount: number
  onDateChange: (date: Date | undefined) => void
  onSlotChange: (slotId: string | undefined) => void
}

interface TimeSlot {
  id: string
  start_time: string
  end_time: string
  capacity: number
  booked_count: number
  available_spots: number
}

export const SlotSelector = ({ 
  experienceId, 
  selectedDate, 
  selectedSlotId, 
  participantCount,
  onDateChange, 
  onSlotChange 
}: SlotSelectorProps) => {
  // Query to get available dates (dates with available slots)
  const { data: availableDates } = useQuery({
    queryKey: ['available-dates', experienceId, participantCount],
    queryFn: async () => {
      // Get all time slots for the experience
      const { data: slots, error: slotsError } = await supabase
        .from('time_slots')
        .select('*')
        .eq('experience_id', experienceId)
      
      if (slotsError) throw slotsError
      
      // Get all bookings for this experience
      const { data: bookings, error: bookingsError } = await supabase
        .from('bookings')
        .select('time_slot_id, total_participants, booking_date')
        .eq('experience_id', experienceId)
        .eq('status', 'confirmed')
      
      if (bookingsError) throw bookingsError
      
      // Group bookings by date
      const bookingsByDate = bookings.reduce((acc, booking) => {
        const dateStr = booking.booking_date.split('T')[0]
        if (!acc[dateStr]) acc[dateStr] = []
        acc[dateStr].push(booking)
        return acc
      }, {} as Record<string, any[]>)
      
      // Check each date from today onwards for the next 365 days
      const availableDates = new Set<string>()
      const today = new Date()
      
      for (let i = 0; i < 365; i++) {
        const checkDate = new Date(today)
        checkDate.setDate(today.getDate() + i)
        const dateStr = checkDate.toISOString().split('T')[0]
        
        // Check if any slot has availability for this date
        const hasAvailableSlot = slots.some(slot => {
          const slotBookings = bookingsByDate[dateStr]?.filter(booking => booking.time_slot_id === slot.id) || []
          const bookedCount = slotBookings.reduce((sum, booking) => sum + booking.total_participants, 0)
          const availableSpots = slot.capacity - bookedCount
          return availableSpots >= participantCount
        })
        
        if (hasAvailableSlot) {
          availableDates.add(dateStr)
        }
      }
      
      return availableDates
    },
    enabled: !!experienceId
  })

  const { data: timeSlots, isLoading } = useQuery({
    queryKey: ['time-slots', experienceId, selectedDate],
    queryFn: async () => {
      if (!selectedDate) return []
      
      const dateStr = selectedDate.toISOString().split('T')[0]
      
      // Get time slots for the experience
      const { data: slots, error: slotsError } = await supabase
        .from('time_slots')
        .select('*')
        .eq('experience_id', experienceId)
      
      if (slotsError) throw slotsError
      
      // Get bookings for this specific date
      const { data: bookings, error: bookingsError } = await supabase
        .from('bookings')
        .select('time_slot_id, total_participants')
        .eq('experience_id', experienceId)
        .gte('booking_date', `${dateStr}T00:00:00`)
        .lt('booking_date', `${dateStr}T23:59:59`)
        .eq('status', 'confirmed')
      
      if (bookingsError) throw bookingsError
      
      // Calculate availability for each slot
      const slotsWithAvailability = slots.map(slot => {
        const slotBookings = bookings.filter(booking => booking.time_slot_id === slot.id)
        const bookedCount = slotBookings.reduce((sum, booking) => sum + booking.total_participants, 0)
        const availableSpots = slot.capacity - bookedCount
        
        return {
          ...slot,
          booked_count: bookedCount,
          available_spots: Math.max(0, availableSpots)
        }
      })
      
      return slotsWithAvailability as TimeSlot[]
    },
    enabled: !!experienceId && !!selectedDate
  })

  const formatTime = (time: string) => {
    const [hours, minutes] = time.split(':')
    const hour24 = parseInt(hours)
    const hour12 = hour24 === 0 ? 12 : hour24 > 12 ? hour24 - 12 : hour24
    const ampm = hour24 >= 12 ? 'PM' : 'AM'
    return `${hour12}:${minutes} ${ampm}`
  }

  const isSlotAvailable = (slot: TimeSlot) => {
    return slot.available_spots >= participantCount
  }

  const getSlotStatusBadge = (slot: TimeSlot) => {
    if (slot.available_spots === 0) {
      return <Badge variant="secondary" className="bg-error/10 text-error-dark border-error/20">Fully Booked</Badge>
    }
    if (slot.available_spots < participantCount) {
      return <Badge variant="secondary" className="bg-warning/10 text-warning-dark border-warning/20">Not Enough Spots</Badge>
    }
    if (slot.available_spots <= 3) {
      return <Badge variant="secondary" className="bg-warning/10 text-warning-dark border-warning/20">Few Spots Left</Badge>
    }
    return <Badge variant="secondary" className="bg-success/10 text-success-dark border-success/20">Available</Badge>
  }

  const today = new Date()
  today.setHours(0, 0, 0, 0)

  // Function to check if a date should be disabled
  const isDateDisabled = (date: Date) => {
    // Disable past dates
    if (date < today) return true
    
    // If availableDates is not loaded yet, don't disable any future dates
    if (!availableDates) return false
    
    // Disable dates that don't have available slots
    const dateStr = date.toISOString().split('T')[0]
    return !availableDates.has(dateStr)
  }

  return (
    <div className="space-y-6">
      <div>
        <Label className="text-base font-semibold mb-3 block">Select Date</Label>
        <Calendar
          mode="single"
          selected={selectedDate}
          onSelect={onDateChange}
          disabled={isDateDisabled}
          className="rounded-md border"
        />
      </div>

      {selectedDate && (
        <div>
          <Label className="text-base font-semibold mb-3 block">
            Available Time Slots for {format(selectedDate, 'MMM d, yyyy')}
          </Label>
          
          {isLoading ? (
            <div className="space-y-2">
              {[1, 2, 3].map((i) => (
                <div key={i} className="h-16 bg-muted animate-pulse rounded-lg"></div>
              ))}
            </div>
          ) : timeSlots && timeSlots.length > 0 ? (
            <div className="space-y-3">
              {timeSlots.map((slot) => {
                const available = isSlotAvailable(slot)
                const isSelected = selectedSlotId === slot.id
                
                return (
                  <Card 
                    key={slot.id} 
                    className={`cursor-pointer transition-colors ${
                      isSelected 
                        ? 'border-brand-primary bg-brand-primary/5 dark:bg-brand-primary/10' 
                        : available 
                        ? 'hover:border-brand-primary/30' 
                        : 'opacity-50 cursor-not-allowed'
                    }`}
                    onClick={() => available && onSlotChange(isSelected ? undefined : slot.id)}
                  >
                    <CardContent className="p-4">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          <Clock className="h-5 w-5 text-muted-foreground" />
                          <div>
                            <div className="font-medium">
                              {formatTime(slot.start_time)} - {formatTime(slot.end_time)}
                            </div>
                            <div className="flex items-center gap-2 text-sm text-muted-foreground">
                              <Users className="h-4 w-4" />
                              <span>
                                {slot.available_spots} of {slot.capacity} spots available
                                {slot.booked_count > 0 && ` (${slot.booked_count} booked)`}
                              </span>
                            </div>
                          </div>
                        </div>
                        
                        <div className="flex items-center gap-2">
                          {getSlotStatusBadge(slot)}
                          {isSelected && (
                            <Badge className="bg-brand-primary">
                              Selected
                            </Badge>
                          )}
                        </div>
                      </div>
                      
                      {!available && slot.available_spots > 0 && (
                        <div className="mt-2 text-sm text-error">
                          Only {slot.available_spots} spots left, but you need {participantCount}
                        </div>
                      )}
                    </CardContent>
                  </Card>
                )
              })}
            </div>
          ) : (
            <Card>
              <CardContent className="p-8 text-center">
                <div className="text-muted-foreground">
                  No time slots available for this date
                </div>
              </CardContent>
            </Card>
          )}
        </div>
      )}
    </div>
  )
}
