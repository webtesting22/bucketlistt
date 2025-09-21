import { Badge } from "@/components/ui/badge";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { useQuery } from "@tanstack/react-query";
import { format } from "date-fns";
import { FileText } from "lucide-react";
import { useNavigate } from "react-router-dom";

interface BookingWithDueAmount {
  due_amount?: number;
  [key: string]: any;
}

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
            location,
            price,
            currency
          ),
          time_slots (
            id,
            start_time,
            end_time,
            activity_id,
            activities (
              id,
              name,
              price,
              currency
            )
          ),
          booking_participants (
            name,
            email
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

  const getStatusColor = (status) => {
    switch (status?.toLowerCase()) {
      case "confirmed":
        return "bg-green-100 text-green-700";
      case "pending":
        return "bg-yellow-100 text-yellow-700";
      case "cancelled":
        return "bg-red-100 text-red-700";
      default:
        return "bg-gray-100 text-gray-700";
    }
  };

  if (isLoading) return <p className="text-center py-10">Loading...</p>;

  if (!bookings || bookings.length === 0)
    return (
      <div className="text-center py-10 text-muted-foreground">
        No bookings yet!
      </div>
    );

  return (
    <div className="overflow-x-auto">
      <table className="min-w-full table-auto border-collapse border border-gray-200">
        <thead className="bg-gray-100">
          <tr>
            <th className="px-4 py-2 border">Title</th>
            <th className="px-4 py-2 border">Activity</th>
            <th className="px-4 py-2 border">Date</th>
            <th className="px-4 py-2 border">Location</th>
            <th className="px-4 py-2 border">Participants</th>
            <th className="px-4 py-2 border">Price</th>
            <th className="px-4 py-2 border">Status</th>
            <th className="px-4 py-2 border">Notes for Guide</th>
          </tr>
        </thead>
        <tbody>
          {bookings.map((booking) => (
            <tr
              key={booking.id}
              className="hover:bg-gray-50"
              // onClick={() =>
              //   navigate(`/experience/${booking.experiences?.id}`)
              // }
            >
              <td
                className="px-4 py-2 border cursor-pointer hover:text-brand-primary"
                onClick={() =>
                  navigate(`/experience/${booking.experiences?.id}`)
                }
              >
                {booking.experiences?.title}
              </td>
              <td className="px-4 py-2 border">
                {booking.time_slots?.activities && (
                  <>Activity: {booking.time_slots.activities.name}</>
                )}
              </td>
              <td className="px-4 py-2 border">
                {format(new Date(booking.booking_date), "MMM d, yyyy")}
              </td>
              <td className="px-4 py-2 border cursor-pointer hover:text-brand-primary">
                {" "}
                <a
                  // href={`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(
                  //   booking.experiences?.location
                  // )}`}
                  href={booking.experiences?.location}
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  {booking.experiences?.location}
                </a>
              </td>
              <td className="px-4 py-2 border">
                {booking.booking_participants?.map((p) => p.name).join(", ")}
              </td>
              <td className="px-4 py-2 border text-center">
                {(() => {
                  const activity = booking.time_slots?.activities;
                  const activityPrice =
                    activity?.price || booking.experiences?.price || 0;
                  const activityCurrency =
                    activity?.currency ||
                    booking.experiences?.currency ||
                    "INR";
                  const totalAmount =
                    activityPrice * booking.total_participants;
                  const dueAmount =
                    (booking as BookingWithDueAmount).due_amount || 0;
                  const paidAmount = totalAmount - dueAmount;

                  return (
                    <div>
                      {dueAmount > 0 ? (
                        // Partial payment display
                        <div>
                          <div className="text-lg font-bold text-green-600 mb-1">
                            {activityCurrency} {paidAmount}
                          </div>
                          <div className="text-sm text-orange-600 mb-1">
                            Due On-Site: {activityCurrency} {dueAmount}
                          </div>
                          <div className="text-xs text-muted-foreground">
                            Total: {activityCurrency} {totalAmount}
                          </div>
                        </div>
                      ) : (
                        // Full payment display
                        <div>
                          <div className="text-lg font-bold text-orange-500 mb-1">
                            {activityCurrency} {totalAmount}
                          </div>
                          <div className="text-sm text-muted-foreground">
                            {booking.total_participants} × {activityCurrency}{" "}
                            {activityPrice}
                          </div>
                        </div>
                      )}
                    </div>
                  );
                })()}
              </td>
              <td className="px-4 py-2 border">
                <Badge className={`${getStatusColor(booking.status)}`}>
                  {booking.status}
                </Badge>
                {(booking as BookingWithDueAmount).due_amount &&
                (booking as BookingWithDueAmount).due_amount! > 0 ? (
                  <Badge
                    variant="secondary"
                    className="bg-orange-100 text-orange-800"
                  >
                    Partial Payment
                  </Badge>
                ) : null}
              </td>
              <td className="px-4 py-2 border">
                <p className="text-sm text-muted-foreground">
                  {booking.note_for_guide || "N/A"}
                </p>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};
