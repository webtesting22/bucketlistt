import { Badge } from "@/components/ui/badge";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { useQuery } from "@tanstack/react-query";
import { format } from "date-fns";
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
            location,
            price,
            currency
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
            <th className="px-4 py-2 border">Date</th>
            <th className="px-4 py-2 border">Location</th>
            <th className="px-4 py-2 border">Participants</th>
            <th className="px-4 py-2 border">Price</th>
            <th className="px-4 py-2 border">Status</th>
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
              <td className="px-4 py-2 border text-right">
                {booking.experiences?.currency === "USD"
                  ? "₹"
                  : booking.experiences?.currency}
                {(booking.experiences?.price || 0) * booking.total_participants}
              </td>
              <td className="px-4 py-2 border">
                <Badge className={`${getStatusColor(booking.status)}`}>
                  {booking.status}
                </Badge>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};
