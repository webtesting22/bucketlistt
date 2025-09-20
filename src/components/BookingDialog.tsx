import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import { Switch } from "@/components/ui/switch";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Card, CardContent } from "@/components/ui/card";
import { Plus, X } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { useToast } from "@/hooks/use-toast";
import { SlotSelector } from "@/components/SlotSelector";
import { useNavigate } from "react-router-dom";
import { useRazorpay } from "@/hooks/useRazorpay";
import { SendWhatsappMessage } from "@/utils/whatsappUtil";
import moment from "moment";
import { useQuery } from "@tanstack/react-query";
import { Modal } from "antd";
import { format } from "date-fns";

const participantSchema = z.object({
  name: z.string().min(1, "Name is required"),
  email: z.string().email("Valid email is required"),
  phone_number: z.string().min(1, "Phone number is required"),
});

const bookingSchema = z.object({
  participants: z
    .array(participantSchema)
    .min(1, "At least one participant is required"),
  note_for_guide: z.string().optional(),
  terms_accepted: z
    .boolean()
    .refine((val) => val === true, "You must accept the terms and conditions"),
  booking_date: z.date({ required_error: "Please select a date" }),
  time_slot_id: z.string().min(1, "Please select a time slot"),
  referral_code: z.string().optional(),
});

type BookingFormData = z.infer<typeof bookingSchema>;

interface BookingDialogProps {
  isOpen: boolean;
  onClose: () => void;
  experience: {
    id: string;
    title: string;
    price: number;
    currency: string;
  };
  onBookingSuccess: () => void;
}

export const BookingDialog = ({
  isOpen,
  onClose,
  experience,
  onBookingSuccess,
}: BookingDialogProps) => {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [selectedDate, setSelectedDate] = useState<Date | undefined>(undefined);
  const [selectedSlotId, setSelectedSlotId] = useState<string | undefined>(
    undefined
  );
  const [bypassPayment, setBypassPayment] = useState(false);
  const [selectedActivityId, setSelectedActivityId] = useState<string>();
  const [currentStep, setCurrentStep] = useState(1); // 1: Selection, 2: Participants
  const { user } = useAuth();
  const { toast } = useToast();
  const navigate = useNavigate();
  const { openRazorpay } = useRazorpay();

  const form = useForm<BookingFormData>({
    resolver: zodResolver(bookingSchema),
    defaultValues: {
      participants: [{ name: "", email: "", phone_number: "" }],
      note_for_guide: "",
      terms_accepted: false,
      referral_code: "",
    },
  });

  const participants = form.watch("participants");
  const totalPrice = experience.price * participants.length;

  const addParticipant = () => {
    const currentParticipants = form.getValues("participants");
    form.setValue("participants", [
      ...currentParticipants,
      { name: "", email: "", phone_number: "" },
    ]);
  };

  const removeParticipant = (index: number) => {
    const currentParticipants = form.getValues("participants");
    if (currentParticipants.length > 1) {
      form.setValue(
        "participants",
        currentParticipants.filter((_, i) => i !== index)
      );
    }
  };
  console.log("experience", experience);
  const handleDateChange = (date: Date | undefined) => {
    setSelectedDate(date);
    setSelectedSlotId(undefined);
    form.setValue("booking_date", date as Date);
    form.setValue("time_slot_id", "");
  };

  const handleSlotChange = (slotId: string | undefined) => {
    setSelectedSlotId(slotId);
    form.setValue("time_slot_id", slotId || "");
  };

  // Step navigation functions
  const handleNextStep = () => {
    if (selectedActivityId && selectedDate && selectedSlotId) {
      setCurrentStep(2);
    } else {
      toast({
        title: "Missing information",
        description: "Please select activity, date, and time slot",
        variant: "destructive",
      });
    }
  };

  const handlePrevStep = () => {
    setCurrentStep(1);
  };

  const handleClose = () => {
    setCurrentStep(1);
    form.reset();
    setSelectedDate(undefined);
    setSelectedSlotId(undefined);
    setSelectedActivityId(undefined);
    setBypassPayment(false);
    setIsSubmitting(false);
    onClose();
  };

  const sendBookingConfirmationEmail = async (
    data: BookingFormData,
    bookingId: string,
    paymentId?: string
  ) => {
    try {
      console.log("Sending booking confirmation email...");

      // Get time slot details for email
      const { data: timeSlot } = await supabase
        .from("time_slots")
        .select("start_time, end_time")
        .eq("id", selectedSlotId)
        .single();
      console.log(data);
      const whatsappBody = {
        version: "2.0",
        country_code: "91",
        wid: "15520",
        type: "text",
        data: [
          {
            mobile: data.participants[0].phone_number,
            bodyValues: {
              "1": data.participants[0].name,
              "2": experience.title,
              "3": `${moment(selectedDate).format("DD/MM/YYYY")} - ${moment(
                timeSlot?.start_time,
                "HH:mm"
              ).format("hh:mm A")} - ${moment(
                timeSlot?.end_time,
                "HH:mm"
              ).format("hh:mm A")}`,
              "4": experience?.location,
            },
          },
        ],
      };

      const whatsappResponse = await SendWhatsappMessage(whatsappBody);
      console.log(whatsappResponse);
      // console.log(experience);
      // console.log(data)

      const emailResponse = await supabase.functions.invoke(
        "send-booking-confirmation",
        {
          body: {
            customerEmail: data.participants[0].email,
            customerName: data.participants[0].name,
            experienceTitle: experience.title,
            bookingDate: selectedDate?.toISOString(),
            timeSlot: timeSlot
              ? `${timeSlot.start_time} - ${timeSlot.end_time}`
              : "Time slot details unavailable",
            totalParticipants: data.participants.length,
            totalAmount: totalPrice,
            currency: experience.currency,
            participants: data.participants,
            bookingId: bookingId,
            noteForGuide: data.note_for_guide,
            paymentId: paymentId || "BYPASSED",
          },
        }
      );

      if (emailResponse.error) {
        console.error("Email sending error:", emailResponse.error);
        throw emailResponse.error;
      } else {
        console.log("Email sent successfully:", emailResponse.data);
      }
    } catch (emailError) {
      console.error("Email sending failed:", emailError);
      // Don't throw the error to prevent booking failure
      toast({
        title: "Booking confirmed",
        description:
          "Your booking was successful, but we couldn't send the confirmation email. Please check your booking in your profile.",
        variant: "default",
      });
    }
  };

  const createDirectBooking = async (data: BookingFormData) => {
    if (!user || !selectedDate || !selectedSlotId) return;

    try {
      console.log("Creating direct booking (bypassing payment)...");

      // Create the booking
      const { data: booking, error: bookingError } = await supabase
        .from("bookings")
        .insert({
          user_id: user.id,
          experience_id: experience.id,
          time_slot_id: selectedSlotId,
          booking_date: selectedDate.toISOString(),
          note_for_guide: data.note_for_guide || null,
          total_participants: data.participants.length,
          terms_accepted: data.terms_accepted,
          referral_code: data?.referral_code,
        })
        .select()
        .single();

      if (bookingError) {
        console.error("Booking creation error:", bookingError);
        throw bookingError;
      }

      console.log("Booking created successfully:", booking.id);

      // Create participants
      const participantsData = data.participants.map((participant) => ({
        booking_id: booking.id,
        name: participant.name,
        email: participant.email,
        phone_number: participant.phone_number,
      }));

      const { error: participantsError } = await supabase
        .from("booking_participants")
        .insert(participantsData);

      if (participantsError) {
        console.error("Participants creation error:", participantsError);
        throw participantsError;
      }

      console.log("Participants created successfully");

      // Send confirmation email
      await sendBookingConfirmationEmail(data, booking.id);

      toast({
        title: "Booking confirmed!",
        description:
          "Your booking has been confirmed (payment bypassed for beta testing).",
      });

      onBookingSuccess();
      handleClose();
    } catch (error) {
      console.error("Direct booking creation error:", error);
      setIsSubmitting(false);
      toast({
        title: "Booking failed",
        description:
          "There was an error creating your booking. Please try again.",
        variant: "destructive",
      });
    }
  };

  const createBookingAfterPayment = async (
    data: BookingFormData,
    paymentId: string
  ) => {
    if (!user || !selectedDate || !selectedSlotId) return;

    try {
      console.log("Creating booking after successful payment...");

      // Create the booking
      const { data: booking, error: bookingError } = await supabase
        .from("bookings")
        .insert({
          user_id: user.id,
          experience_id: experience.id,
          time_slot_id: selectedSlotId,
          booking_date: selectedDate.toISOString(),
          note_for_guide: data.note_for_guide || null,
          total_participants: data.participants.length,
          terms_accepted: data.terms_accepted,
          referral_code: data?.referral_code,
        })
        .select()
        .single();

      if (bookingError) {
        console.error("Booking creation error:", bookingError);
        throw bookingError;
      }

      console.log("Booking created successfully:", booking.id);

      // Create participants
      const participantsData = data.participants.map((participant) => ({
        booking_id: booking.id,
        name: participant.name,
        email: participant.email,
        phone_number: participant.phone_number,
      }));

      const { error: participantsError } = await supabase
        .from("booking_participants")
        .insert(participantsData);

      if (participantsError) {
        console.error("Participants creation error:", participantsError);
        throw participantsError;
      }

      console.log("Participants created successfully");

      // Send confirmation email
      await sendBookingConfirmationEmail(data, booking.id, paymentId);

      toast({
        title: "Booking confirmed!",
        description:
          "Your payment was successful and booking has been confirmed.",
      });

      onBookingSuccess();
      handleClose();
    } catch (error) {
      console.error("Booking creation error:", error);
      setIsSubmitting(false);
      toast({
        title: "Booking failed",
        description:
          "Payment was successful but there was an error creating your booking. Please contact support.",
        variant: "destructive",
      });
    }
  };
  console.log("experiencessssss", experience);
  const onSubmit = async (data: BookingFormData) => {
    if (!user) {
      toast({
        title: "Authentication required",
        description: "Please log in to make a booking",
        variant: "destructive",
      });
      return;
    }

    if (!selectedDate || !selectedSlotId) {
      toast({
        title: "Missing information",
        description: "Please select both a date and time slot",
        variant: "destructive",
      });
      return;
    }

    setIsSubmitting(true);

    // If bypass payment is enabled, create booking directly
    if (bypassPayment) {
      await createDirectBooking(data);
      return;
    }

    console.log("Starting booking process...");

    try {
      console.log("Creating Razorpay order...");
      const orderPayload = {
        amount: totalPrice,
        currency: experience.currency,
        experienceTitle: experience.title,
        bookingData: {
          experience_id: experience.id,
          time_slot_id: selectedSlotId,
          booking_date: selectedDate.toISOString(),
          participants: data.participants,
          note_for_guide: data.note_for_guide,
          referral_code: data?.referral_code,
        },
      };
      console.log("Order payload:", orderPayload);

      const { data: orderData, error: orderError } =
        await supabase.functions.invoke("create-razorpay-order", {
          body: orderPayload,
        });

      console.log("Supabase function response:", { orderData, orderError });

      if (orderError) {
        console.error("Supabase function error:", orderError);
        throw new Error(`Order creation failed: ${orderError.message}`);
      }

      if (!orderData || !orderData.order) {
        console.error("Invalid response from order creation:", orderData);
        throw new Error("Invalid response from payment service");
      }

      const { order } = orderData;
      console.log("Razorpay order created successfully:", order);

      // Open Razorpay payment with the live key
      await openRazorpay({
        key: import.meta.env.VITE_RAZORPAY_KEY_ID || "rzp_live_AyU0PWr4XJPUZ8",
        amount: order.amount,
        currency: order.currency,
        name: "bucketlistt Experiences",
        description: `Book ${experience.title}`,
        order_id: order.id,
        handler: async (response: any) => {
          console.log("Payment successful:", response);
          await createBookingAfterPayment(data, response.razorpay_payment_id);
        },
        prefill: {
          name: data.participants[0].name,
          email: data.participants[0].email,
          contact: data.participants[0].phone_number,
        },
        theme: {
          color: "hsl(var(--brand-primary))",
        },
        modal: {
          ondismiss: () => {
            console.log("Payment modal dismissed by user");
            setIsSubmitting(false);
            toast({
              title: "Payment cancelled",
              description: "Your booking was not completed.",
              variant: "destructive",
            });
          },
        },
      });
    } catch (error: any) {
      console.error("Payment initiation error:", error);
      setIsSubmitting(false);
      toast({
        title: "Payment failed",
        description:
          error.message ||
          "There was an error initiating payment. Please try again.",
        variant: "destructive",
      });
    }
  };

  // Add query for selected activity details
  const { data: selectedActivity } = useQuery({
    queryKey: ["activity", selectedActivityId],
    queryFn: async () => {
      if (!selectedActivityId) return null;

      const { data, error } = await supabase
        .from("activities")
        .select("*")
        .eq("id", selectedActivityId)
        .single();

      if (error) throw error;
      return data;
    },
    enabled: !!selectedActivityId,
  });

  // Get time slots for summary display
  const { data: timeSlots } = useQuery({
    queryKey: ['time-slots-summary', experience.id, selectedDate, selectedActivityId],
    queryFn: async () => {
      if (!selectedDate || !selectedActivityId) return [];

      const dateStr = selectedDate.toISOString().split('T')[0];
      const { data, error } = await supabase
        .from('time_slots')
        .select('*')
        .eq('experience_id', experience.id)
        .eq('activity_id', selectedActivityId);

      if (error) throw error;
      return data || [];
    },
    enabled: !!selectedDate && !!selectedActivityId,
  });

  // Format time function
  const formatTime = (time: string) => {
    const [hours, minutes] = time.split(':');
    const hour24 = parseInt(hours);
    const hour12 = hour24 === 0 ? 12 : hour24 > 12 ? hour24 - 12 : hour24;
    const ampm = hour24 >= 12 ? 'PM' : 'AM';
    return `${hour12}:${minutes} ${ampm}`;
  };

  // Update price calculation to use activity price
  const totalActivityPrice = selectedActivity
    ? selectedActivity.price * participants.length
    : 0;

  return (
    <Modal
      open={isOpen}
      onCancel={handleClose}
      title={`Book Experience: ${experience.title} - Step ${currentStep} of 2`}
      width={1000}
      footer={null}
      destroyOnClose={true}
      maskClosable={false}
    >
      {currentStep === 1 ? (
        // Step 1: Activity, Date, and Time Selection
        <div className="space-y-6">
          <SlotSelector
            experienceId={experience.id}
            selectedDate={selectedDate}
            selectedSlotId={selectedSlotId}
            selectedActivityId={selectedActivityId}
            participantCount={participants.length}
            onDateChange={handleDateChange}
            onSlotChange={handleSlotChange}
            onActivityChange={setSelectedActivityId}
          />

          {/* Step 1 Footer */}
          <div className="flex gap-3 pt-4">
            <Button
              type="button"
              variant="outline"
              onClick={handleClose}
              className="flex-1"
            >
              Cancel
            </Button>
            <Button
              type="button"
              onClick={handleNextStep}
              disabled={!selectedActivityId || !selectedDate || !selectedSlotId}
              className="flex-1 bg-orange-500 hover:bg-orange-600"
            >
              Next
            </Button>
          </div>
        </div>
      ) : (
        // Step 2: Participants and Payment Details
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Left Column: Activity Summary */}
              <div>
                <h3 className="text-lg font-semibold mb-4">Booking Summary</h3>
                <Card className="p-4">
                  <div className="space-y-2">
                    <div className="flex justify-between">
                      <span className="text-gray-600">Activity:</span>
                      <span className="font-medium">{selectedActivity?.name}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">Date:</span>
                      <span className="font-medium">{selectedDate ? format(selectedDate, 'MMM d, yyyy') : ''}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">Time:</span>
                      <span className="font-medium">
                        {timeSlots?.find(slot => slot.id === selectedSlotId) ?
                          `${formatTime(timeSlots.find(slot => slot.id === selectedSlotId)!.start_time)} - ${formatTime(timeSlots.find(slot => slot.id === selectedSlotId)!.end_time)}` :
                          ''
                        }
                      </span>
                    </div>
                  </div>
                </Card>
              </div>

              {/* Right Column: Participants and Details */}
              <div className="space-y-6">
                {/* Bypass Payment Toggle */}
                <Card className="border-orange-200 bg-orange-50 dark:bg-orange-950/20">
                  <CardContent className="p-4">
                    <div className="flex items-center justify-between">
                      <div>
                        <h4 className="font-medium text-orange-800 dark:text-orange-200">
                          Bypass Payment (Beta)
                        </h4>
                        <p className="text-sm text-orange-600 dark:text-orange-300">
                          Skip payment and create booking directly for testing
                        </p>
                      </div>
                      <Switch
                        checked={bypassPayment}
                        onCheckedChange={setBypassPayment}
                      />
                    </div>
                  </CardContent>
                </Card>

                {/* Participants Section */}
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <h3 className="text-lg font-semibold">Participants</h3>
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={addParticipant}
                      className="flex items-center gap-2"
                    >
                      <Plus className="h-4 w-4" />
                      Add Person
                    </Button>
                  </div>

                  {participants.map((_, index) => (
                    <Card key={index} className="relative">
                      <CardContent className="p-4">
                        <div className="flex items-center justify-between mb-3">
                          <h4 className="font-medium">Person {index + 1}</h4>
                          {participants.length > 1 && (
                            <Button
                              type="button"
                              variant="ghost"
                              size="sm"
                              onClick={() => removeParticipant(index)}
                              className="text-red-500 hover:text-red-700"
                            >
                              <X className="h-4 w-4" />
                            </Button>
                          )}
                        </div>

                        <div className="grid grid-cols-1 gap-4">
                          <FormField
                            control={form.control}
                            name={`participants.${index}.name`}
                            render={({ field }) => (
                              <FormItem>
                                <FormLabel>Name</FormLabel>
                                <FormControl>
                                  <Input placeholder="Full name" {...field} />
                                </FormControl>
                                <FormMessage />
                              </FormItem>
                            )}
                          />

                          <FormField
                            control={form.control}
                            name={`participants.${index}.email`}
                            render={({ field }) => (
                              <FormItem>
                                <FormLabel>Email</FormLabel>
                                <FormControl>
                                  <Input
                                    placeholder="email@example.com"
                                    {...field}
                                  />
                                </FormControl>
                                <FormMessage />
                              </FormItem>
                            )}
                          />

                          <FormField
                            control={form.control}
                            name={`participants.${index}.phone_number`}
                            render={({ field }) => (
                              <FormItem>
                                <FormLabel>Phone</FormLabel>
                                <FormControl>
                                  <Input
                                    placeholder="Phone number"
                                    {...field}
                                  />
                                </FormControl>
                                <FormMessage />
                              </FormItem>
                            )}
                          />
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>

                {/* Note for Guide */}
                <FormField
                  control={form.control}
                  name="note_for_guide"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Note for Tour Guide (Optional)</FormLabel>
                      <FormControl>
                        <Textarea
                          placeholder="Any special requests or information for your guide..."
                          {...field}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="referral_code"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Referal Code</FormLabel>
                      <FormControl>
                        <Input placeholder="Referal Code" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                {/* Terms and Conditions */}
                <FormField
                  control={form.control}
                  name="terms_accepted"
                  render={({ field }) => (
                    <FormItem className="flex flex-row items-start space-x-3 space-y-0">
                      <FormControl>
                        <Checkbox
                          checked={field.value}
                          onCheckedChange={field.onChange}
                        />
                      </FormControl>
                      <div className="space-y-1 leading-none">
                        <FormLabel className="cursor-pointer">
                          I accept the{" "}
                          <a
                            href="/terms"
                            target="_blank"
                            rel="noopener noreferrer"
                            className="p-0 h-auto text-orange-500 hover:text-orange-600"
                          >
                            Terms & Conditions
                          </a>
                        </FormLabel>
                        <FormMessage />
                      </div>
                    </FormItem>
                  )}
                />

                {/* Price Summary */}
                <Card className="bg-muted">
                  <CardContent className="p-4">
                    <div className="flex justify-between items-center">
                      <div>
                        <span className="text-lg font-semibold">
                          Total Cost
                        </span>
                        {selectedActivity && (
                          <div className="text-sm text-muted-foreground">
                            {selectedActivity.name}
                          </div>
                        )}
                      </div>
                      <div className="text-right">
                        <div className="text-2xl font-bold text-orange-500">
                          {selectedActivity?.currency} {totalActivityPrice}
                        </div>
                        <div className="text-sm text-muted-foreground">
                          {participants.length} participant
                          {participants.length > 1 ? "s" : ""} ×{" "}
                          {selectedActivity?.currency} {selectedActivity?.price}
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </div>
            </div>

            {/* Step 2 Footer */}
            <div className="flex gap-3 pt-4">
              <Button
                type="button"
                variant="outline"
                onClick={handlePrevStep}
                className="flex-1"
              >
                Back
              </Button>
              <Button
                type="submit"
                disabled={isSubmitting || !selectedDate || !selectedSlotId}
                className="flex-1 bg-orange-500 hover:bg-orange-600"
              >
                {isSubmitting ? "Processing..." : "Pay & Confirm Booking"}
              </Button>
            </div>
          </form>
        </Form>
      )}
    </Modal>
  );
};
