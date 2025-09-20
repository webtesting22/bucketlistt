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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Plus, X, Tag, CheckCircle, AlertCircle } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { useToast } from "@/hooks/use-toast";
import { SlotSelector } from "@/components/SlotSelector";
import { useNavigate } from "react-router-dom";
import { useRazorpay } from "@/hooks/useRazorpay";
import { SendWhatsappMessage } from "@/utils/whatsappUtil";
import moment from "moment";
import { useQuery } from "@tanstack/react-query";
import { useDiscountCoupon } from "@/hooks/useDiscountCoupon";

const participantSchema = z.object({
  name: z.string().min(1, "Name is required"),
  email: z.string().email("Valid email is required"),
  phone_number: z.string().min(1, "Phone number is required"),
});

const bookingSchema = z.object({
  participant: participantSchema,
  participant_count: z
    .number()
    .min(1, "At least one participant is required")
    .max(6, "Maximum 6 participants allowed"),
  note_for_guide: z.string().optional(),
  terms_accepted: z
    .boolean()
    .refine((val) => val === true, "You must accept the terms and conditions"),
  booking_date: z.date({ required_error: "Please select a date" }),
  time_slot_id: z.string().min(1, "Please select a time slot"),
  referral_code: z.string().optional(),
  coupon_code: z.string().optional(),
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
  appliedCoupon?: {
    coupon: {
      coupon_code: string;
      type: string;
      discount_value: number;
    };
    discount_calculation: {
      original_amount: number;
      discount_amount: number;
      final_amount: number;
      savings_percentage: number;
    };
  } | null;
}

export const BookingDialog = ({
  isOpen,
  onClose,
  experience,
  onBookingSuccess,
  appliedCoupon,
}: BookingDialogProps) => {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [selectedDate, setSelectedDate] = useState<Date | undefined>(undefined);
  const [selectedSlotId, setSelectedSlotId] = useState<string | undefined>(
    undefined
  );
  const [bypassPayment, setBypassPayment] = useState(false);
  const [partialPayment, setPartialPayment] = useState(false);
  const [selectedActivityId, setSelectedActivityId] = useState<string>();
  const [couponCode, setCouponCode] = useState("");
  const [couponValidation, setCouponValidation] = useState<{
    isValid: boolean;
    message: string;
    coupon?: any;
  } | null>(null);
  const { user } = useAuth();
  const { toast } = useToast();
  const navigate = useNavigate();
  const { openRazorpay } = useRazorpay();
  const { validateCoupon } = useDiscountCoupon();

  const form = useForm<BookingFormData>({
    resolver: zodResolver(bookingSchema),
    defaultValues: {
      participant: { name: "", email: "", phone_number: "" },
      participant_count: 1,
      note_for_guide: "",
      terms_accepted: false,
      referral_code: "",
      coupon_code: "",
    },
  });

  const participantCount = form.watch("participant_count");
  
  // Calculate base price - will be updated when selectedActivity is available
  const basePrice = experience.price * participantCount;

  // Calculate final price with coupon discount
  const calculateFinalPrice = () => {
    // Use local coupon validation result if available, otherwise use appliedCoupon from props
    const activeCoupon =
      couponValidation?.isValid && couponValidation.coupon
        ? couponValidation.coupon
        : appliedCoupon;

    if (activeCoupon && activeCoupon.discount_calculation) {
      // The discount_calculation.final_amount is per person, so multiply by participant count
      return (
        activeCoupon.discount_calculation.final_amount * participantCount
      );
    }
    // Use selected activity price if available, otherwise use experience price
    const currentPrice = selectedActivity ? selectedActivity.price : experience.price;
    return currentPrice * participantCount;
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

  const handleCouponValidation = async () => {
    if (!couponCode.trim()) {
      setCouponValidation({
        isValid: false,
        message: "Please enter a coupon code",
      });
      return;
    }

    try {
      const result = await validateCoupon(
        couponCode,
        experience.id,
        selectedActivity ? selectedActivity.price : experience.price
      );

      if (result.valid && result.discount_calculation) {
        const discountType =
          result.coupon?.type === "percentage" ? "%" : "flat amount";
        const discountText =
          result.coupon?.type === "percentage"
            ? `${result.discount_calculation.savings_percentage.toFixed(1)}%`
            : `${selectedActivity?.currency || experience.currency} ${result.discount_calculation.discount_amount}`;

        setCouponValidation({
          isValid: true,
          message: `Coupon applied! You save ${discountText}`,
          coupon: result,
        });
        form.setValue("coupon_code", couponCode);
        toast({
          title: "Coupon Applied!",
          description: `You saved ${discountText} on your booking!`,
        });
      } else {
        // Show generic error message for all validation failures
        setCouponValidation({
          isValid: false,
          message: "Invalid coupon code",
        });
      }
    } catch (error) {
      console.error("Coupon validation error:", error);
      setCouponValidation({
        isValid: false,
        message: "Error validating coupon. Please try again.",
      });
    }
  };

  const handleCouponCodeChange = (value: string) => {
    setCouponCode(value.toUpperCase());
    // Clear validation when user types
    if (couponValidation) {
      setCouponValidation(null);
    }
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
            mobile: data.participant.phone_number,
            bodyValues: {
              "1": data.participant.name,
              "2": experience.title,
              "3": `${moment(selectedDate).format("DD/MM/YYYY")} - ${moment(
                timeSlot?.start_time,
                "HH:mm"
              ).format("hh:mm A")} - ${moment(
                timeSlot?.end_time,
                "HH:mm"
              ).format("hh:mm A")}`,
              "4": "Experience Location",
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
            customerEmail: data.participant.email,
            customerName: data.participant.name,
            experienceTitle: experience.title,
            bookingDate: selectedDate?.toISOString(),
            timeSlot: timeSlot
              ? `${timeSlot.start_time} - ${timeSlot.end_time}`
              : "Time slot details unavailable",
            totalParticipants: data.participant_count,
            totalAmount: finalPrice,
            upfrontAmount: upfrontAmount,
            dueAmount: dueAmount,
            partialPayment: partialPayment,
            currency: selectedActivity?.currency || experience.currency,
            participants: Array.from({ length: data.participant_count }, () => data.participant),
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
          total_participants: data.participant_count,
          terms_accepted: data.terms_accepted,
          referral_code: data?.referral_code,
          due_amount: partialPayment ? dueAmount : 0,
        })
        .select()
        .single();

      if (bookingError) {
        console.error("Booking creation error:", bookingError);
        throw bookingError;
      }

      console.log("Booking created successfully:", booking.id);

      // Create participants - duplicate the primary participant data for each participant
      const participantsData = Array.from({ length: data.participant_count }, () => ({
        booking_id: booking.id,
        name: data.participant.name,
        email: data.participant.email,
        phone_number: data.participant.phone_number,
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
      onClose();
      form.reset();
      setSelectedDate(undefined);
      setSelectedSlotId(undefined);
      setIsSubmitting(false);
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
          total_participants: data.participant_count,
          terms_accepted: data.terms_accepted,
          referral_code: data?.referral_code,
          due_amount: partialPayment ? dueAmount : 0,
        })
        .select()
        .single();

      if (bookingError) {
        console.error("Booking creation error:", bookingError);
        throw bookingError;
      }

      console.log("Booking created successfully:", booking.id);

      // Create participants - duplicate the primary participant data for each participant
      const participantsData = Array.from({ length: data.participant_count }, () => ({
        booking_id: booking.id,
        name: data.participant.name,
        email: data.participant.email,
        phone_number: data.participant.phone_number,
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
      onClose();
      form.reset();
      setSelectedDate(undefined);
      setSelectedSlotId(undefined);
      setIsSubmitting(false);
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
        amount: upfrontAmount,
        currency: selectedActivity?.currency || experience.currency,
        experienceTitle: experience.title,
        bookingData: {
          experience_id: experience.id,
          time_slot_id: selectedSlotId,
          booking_date: selectedDate.toISOString(),
          participant: data.participant,
          participant_count: data.participant_count,
          note_for_guide: data.note_for_guide,
          referral_code: data?.referral_code,
          coupon_code: data?.coupon_code,
          partial_payment: partialPayment,
          due_amount: partialPayment ? dueAmount : 0,
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
          name: data.participant.name,
          email: data.participant.email,
          contact: data.participant.phone_number,
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

  // Calculate final price and payment amounts after selectedActivity is available
  const finalPrice = calculateFinalPrice();
  const totalPrice = finalPrice;
  
  // Calculate payment amounts for partial payment
  const upfrontAmount = partialPayment ? Math.round(finalPrice * 0.1) : finalPrice;
  const dueAmount = partialPayment ? finalPrice - upfrontAmount : 0;

  // Update price calculation to use activity price
  const totalActivityPrice = selectedActivity
    ? selectedActivity.price * participantCount
    : 0;

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Book Experience: {experience.title}</DialogTitle>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Left Column: Activity, Date and Time Selection */}
              <div>
                <h3 className="text-lg font-semibold mb-4">
                  Select Activity & Time
                </h3>
                <SlotSelector
                  experienceId={experience.id}
                  selectedDate={selectedDate}
                  selectedSlotId={selectedSlotId}
                  selectedActivityId={selectedActivityId}
                  participantCount={participantCount}
                  onDateChange={handleDateChange}
                  onSlotChange={handleSlotChange}
                  onActivityChange={setSelectedActivityId}
                />
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
                  <h3 className="text-lg font-semibold">Participants</h3>
                  
                  {/* Participant Count Selector */}
                  <FormField
                    control={form.control}
                    name="participant_count"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Number of Participants</FormLabel>
                        <Select
                          onValueChange={(value) => field.onChange(parseInt(value))}
                          value={field.value.toString()}
                        >
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue placeholder="Select number of participants" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            {[1, 2, 3, 4, 5, 6].map((count) => (
                              <SelectItem key={count} value={count.toString()}>
                                {count} {count === 1 ? 'Person' : 'People'}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  {/* Single Participant Form */}
                  <Card>
                    <CardContent className="p-4">
                      <h4 className="font-medium mb-4">Primary Contact Details</h4>
                      <div className="grid grid-cols-1 gap-4">
                        <FormField
                          control={form.control}
                          name="participant.name"
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
                          name="participant.email"
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
                          name="participant.phone_number"
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
                      <FormLabel>Referral Code (Optional)</FormLabel>
                      <FormControl>
                        <Input
                          placeholder="Referral Code"
                          {...field}
                          onChange={(e) =>
                            field.onChange(e.target.value.toUpperCase())
                          }
                          value={field.value?.toUpperCase() || ""}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                {/* Coupon Code Section */}
                <div className="space-y-3">
                  <FormField
                    control={form.control}
                    name="coupon_code"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Coupon Code (Optional)</FormLabel>
                        <div className="flex gap-2">
                          <FormControl>
                            <Input
                              placeholder="Enter coupon code"
                              value={couponCode}
                              onChange={(e) =>
                                handleCouponCodeChange(e.target.value)
                              }
                            />
                          </FormControl>
                          <Button
                            type="button"
                            variant="outline"
                            onClick={handleCouponValidation}
                            disabled={!couponCode.trim()}
                            className="flex items-center gap-2"
                          >
                            <Tag className="h-4 w-4" />
                            Apply
                          </Button>
                        </div>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  {/* Coupon Validation Status - Only show error messages */}
                  {couponValidation && !couponValidation.isValid && (
                    <div className="flex items-center gap-2 p-3 rounded-lg bg-red-50 border border-red-200">
                      <AlertCircle className="h-4 w-4 text-red-600" />
                      <span className="text-sm text-red-800">
                        {couponValidation.message}
                      </span>
                    </div>
                  )}

                  {/* Applied Coupon Display */}
                  {((couponValidation?.isValid && couponValidation.coupon) ||
                    appliedCoupon) && (
                    <div className="p-3 bg-green-50 border border-green-200 rounded-lg">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <Tag className="h-4 w-4 text-green-600" />
                          <span className="font-medium text-green-800">
                            Coupon Applied:{" "}
                            {couponValidation?.isValid &&
                            couponValidation.coupon
                              ? couponValidation.coupon.coupon.coupon_code
                              : appliedCoupon.coupon.coupon_code}
                          </span>
                        </div>
                        <Badge
                          variant="secondary"
                          className="bg-green-100 text-green-800"
                        >
                          {(() => {
                            const activeCoupon =
                              couponValidation?.isValid &&
                              couponValidation.coupon
                                ? couponValidation.coupon
                                : appliedCoupon;
                            return activeCoupon.coupon.type === "percentage"
                              ? `Save ${activeCoupon.discount_calculation.savings_percentage.toFixed(
                                  1
                                )}%`
                              : `Save ${experience.currency} ${activeCoupon.discount_calculation.discount_amount}`;
                          })()}
                        </Badge>
                      </div>
                      {/* <div className="mt-2 text-sm text-green-700"> */}
                      {/* {(() => {
                          const activeCoupon =
                            couponValidation?.isValid && couponValidation.coupon
                              ? couponValidation.coupon
                              : appliedCoupon;
                          return (
                            <>
                              <div>
                                Original Price: {experience.currency}{" "}
                                {
                                  activeCoupon.discount_calculation
                                    .original_amount
                                }
                              </div>
                              <div>
                                Discount: -{experience.currency}{" "}
                                {
                                  activeCoupon.discount_calculation
                                    .discount_amount
                                }
                              </div>
                              <div className="font-semibold">
                                Final Price: {experience.currency}{" "}
                                {activeCoupon.discount_calculation.final_amount}
                              </div>
                              {activeCoupon.coupon.type === "flat" && (
                                <div className="text-xs text-green-600 mt-1">
                                  Flat discount of {experience.currency}{" "}
                                  {activeCoupon.coupon.discount_value}
                                </div>
                              )}
                              {activeCoupon.coupon.type === "percentage" && (
                                <div className="text-xs text-green-600 mt-1">
                                  {activeCoupon.coupon.discount_value}% discount
                                </div>
                              )}
                            </>
                          );
                        })()} */}
                      {/* </div> */}
                    </div>
                  )}
                </div>

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
                          {partialPayment ? "Payment Breakdown" : "Total Cost"}
                        </span>
                        {selectedActivity && (
                          <div className="text-sm text-muted-foreground">
                            {selectedActivity.name}
                          </div>
                        )}
                      </div>
                      <div className="text-right">
                        {(() => {
                          const activeCoupon =
                            couponValidation?.isValid && couponValidation.coupon
                              ? couponValidation.coupon
                              : appliedCoupon;

                          if (partialPayment) {
                            return (
                              <div>
                                <div className="text-lg text-muted-foreground line-through">
                                  {selectedActivity?.currency} {totalActivityPrice}
                                </div>
                                <div className="text-2xl font-bold text-green-600">
                                  {selectedActivity?.currency} {finalPrice}
                                </div>
                                <div className="space-y-1 mt-2">
                                  <div className="text-lg font-semibold text-blue-600">
                                    Pay Now: {selectedActivity?.currency} {upfrontAmount}
                                  </div>
                                  <div className="text-sm text-orange-600">
                                    Due On-Site: {selectedActivity?.currency} {dueAmount}
                                  </div>
                                </div>
                                {activeCoupon && (
                                  <div className="text-sm text-green-600 mt-1">
                                    {activeCoupon.coupon.type === "percentage"
                                      ? `Save ${activeCoupon.discount_calculation.savings_percentage.toFixed(1)}%`
                                      : `Save ${selectedActivity?.currency} ${totalActivityPrice - finalPrice}`}
                                  </div>
                                )}
                              </div>
                            );
                          } else if (activeCoupon) {
                            return (
                              <div>
                                <div className="text-lg text-muted-foreground line-through">
                                  {selectedActivity?.currency} {totalActivityPrice}
                                </div>
                                <div className="text-2xl font-bold text-green-600">
                                  {selectedActivity?.currency} {finalPrice}
                                </div>
                                <div className="text-sm text-green-600">
                                  {activeCoupon.coupon.type === "percentage"
                                    ? `Save ${activeCoupon.discount_calculation.savings_percentage.toFixed(1)}%`
                                    : `Save ${selectedActivity?.currency} ${totalActivityPrice - finalPrice}`}
                                </div>
                              </div>
                            );
                          } else {
                            return (
                              <div className="text-2xl font-bold text-orange-500">
                                {selectedActivity?.currency} {totalActivityPrice}
                              </div>
                            );
                          }
                        })()}
                        <div className="text-sm text-muted-foreground">
                          {participantCount} participant
                          {participantCount > 1 ? "s" : ""} ×{" "}
                          {selectedActivity?.currency} {selectedActivity?.price}
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </div>
            </div>

            {/* Partial Payment Toggle */}
            <Card className="border-blue-200 bg-blue-50 dark:bg-blue-950/20">
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <h4 className="font-medium text-blue-800 dark:text-blue-200">
                      Pay 10% Now, Rest On-Site
                    </h4>
                    <p className="text-sm text-blue-600 dark:text-blue-300">
                      Pay 10% upfront, remaining amount to be paid directly to vendor
                    </p>
                  </div>
                  <Switch
                    checked={partialPayment}
                    onCheckedChange={setPartialPayment}
                  />
                </div>
              </CardContent>
            </Card>

            {/* Submit Button */}
            <div className="flex gap-3">
              <Button
                type="button"
                variant="outline"
                onClick={onClose}
                className="flex-1"
              >
                Cancel
              </Button>
              <Button
                type="submit"
                disabled={isSubmitting || !selectedDate || !selectedSlotId}
                className="flex-1 bg-orange-500 hover:bg-orange-600"
              >
                {isSubmitting 
                  ? "Processing..." 
                  : partialPayment 
                    ? `Pay ${selectedActivity?.currency || experience.currency} ${upfrontAmount} & Confirm Booking`
                    : "Pay & Confirm Booking"
                }
              </Button>
            </div>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
};
