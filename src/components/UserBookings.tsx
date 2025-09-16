import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { useQuery } from "@tanstack/react-query";
import { format } from "date-fns";
import { Calendar, FileText, MapPin, Users } from "lucide-react";
import { useNavigate } from "react-router-dom";

export const UserBookings = () => {
  const { user } = useAuth();
  const navigate = useNavigate();

  const { data: bookings, isLoading } = useQuery({
    queryKey: ["user-bookings", user?.id],
    queryFn: async () => {
      if (!user) return [];

      const { data, error } = await supabase
        .from("bookings")
        .select(
          `
          *,
          experiences (
            id,
            title,
            image_url,
            location,
            price,
            currency
          ),
          booking_participants (
            name,
            email,
            phone_number
          )
        `
        )
        .eq("user_id", user.id)
        .order("created_at", { ascending: false });

      if (error) throw error;
      return data;
    },
    enabled: !!user,
  });

  if (isLoading) {
    return (
      <div className="space-y-4">
        <div className="h-32 bg-muted animate-pulse rounded-lg"></div>
        <div className="h-32 bg-muted animate-pulse rounded-lg"></div>
      </div>
    );
  }

  if (!bookings || bookings.length === 0) {
    return (
      <Card>
        <CardContent className="p-8 text-center">
          <div className="w-24 h-24 mx-auto mb-4 bg-purple-100 dark:bg-purple-950/30 rounded-full flex items-center justify-center">
            <Calendar className="h-12 w-12 text-purple-500" />
          </div>
          <h3 className="text-xl font-bold mb-2 text-gray-600 dark:text-gray-300">
            No bookings yet!
          </h3>
          <p className="text-muted-foreground">
            Your booked experiences will appear here.
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-4">
      {bookings.map((booking) => (
        <Card
          key={booking.id}
          className="overflow-hidden cursor-pointer hover:shadow-md transition-shadow"
          onClick={() => navigate(`/experience/${booking.experiences?.id}`)}
        >
          <CardHeader className="pb-3">
            <div className="flex items-start justify-between">
              <div className="flex-1">
                <CardTitle className="text-lg mb-1">
                  {booking.experiences?.title}
                </CardTitle>
                <div className="flex items-center gap-4 text-sm text-muted-foreground">
                  <div className="flex items-center gap-1">
                    <Calendar className="h-4 w-4" />
                    <span>
                      {format(new Date(booking.booking_date), "MMM d, yyyy")}
                    </span>
                  </div>
                  {booking.experiences?.location && (
                    <div className="flex items-center gap-1">
                      <MapPin className="h-4 w-4" />
                      <span>{booking.experiences.location}</span>
                    </div>
                  )}
                </div>
              </div>
              <Badge
                variant="secondary"
                className="bg-green-100 text-green-800"
              >
                {booking.status}
              </Badge>
            </div>
          </CardHeader>

          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <div className="flex items-center gap-2 mb-2">
                  <Users className="h-4 w-4 text-muted-foreground" />
                  <span className="text-sm font-medium">
                    Participants ({booking.total_participants})
                  </span>
                </div>
                <div className="space-y-1 text-sm text-muted-foreground">
                  {booking.booking_participants?.map((participant, index) => (
                    <div key={index} className="flex justify-between">
                      <span>{participant.name}</span>
                      <span>{participant.email}</span>
                    </div>
                  ))}
                </div>
              </div>

              <div className="text-right">
                <div className="text-2xl font-bold text-orange-500 mb-1">
                  {booking.experiences?.currency === "USD"
                    ? "₹"
                    : booking.experiences?.currency}
                  {(booking.experiences?.price || 0) *
                    booking.total_participants}
                </div>
                <div className="text-sm text-muted-foreground">
                  {booking.total_participants} ×{" "}
                  {booking.experiences?.currency === "USD"
                    ? "₹"
                    : booking.experiences?.currency}
                  {booking.experiences?.price}
                </div>
              </div>
            </div>

            {booking.note_for_guide && (
              <div className="border-t pt-3">
                <div className="flex items-center gap-2 mb-1">
                  <FileText className="h-4 w-4 text-muted-foreground" />
                  <span className="text-sm font-medium">Note for Guide</span>
                </div>
                <p className="text-sm text-muted-foreground">
                  {booking.note_for_guide}
                </p>
              </div>
            )}
          </CardContent>
        </Card>
      ))}
    </div>
  );
};
