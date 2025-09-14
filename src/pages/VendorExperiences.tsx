import { Header } from "@/components/Header";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { useQuery } from "@tanstack/react-query";
import { format } from "date-fns";
import {
  Calendar,
  Clock,
  Edit,
  Eye,
  IndianRupee,
  MapPin,
  Plus,
  Star,
  Users,
} from "lucide-react";
import { useNavigate } from "react-router-dom";

// Convert USD to INR (using approximate rate of 83)
const convertToINR = (usdAmount: number) => {
  return usdAmount;
};

const VendorExperiences = () => {
  const { user } = useAuth();
  const navigate = useNavigate();

  // Fetch vendor experiences
  const { data: experiences, isLoading: experiencesLoading } = useQuery({
    queryKey: ["vendor-experiences", user?.id],
    queryFn: async () => {
      if (!user) return [];

      const { data, error } = await supabase
        .from("experiences")
        .select("*")
        .eq("vendor_id", user.id)
        .order("created_at", { ascending: false });

      if (error) throw error;
      return data || [];
    },
    enabled: !!user,
  });

  // Fetch booking analytics for each experience
  const { data: experienceStats } = useQuery({
    queryKey: ["experience-stats", user?.id],
    queryFn: async () => {
      if (!user || !experiences) return {};

      const stats: Record<string, any> = {};

      for (const experience of experiences) {
        const { data: bookings, error } = await supabase
          .from("bookings")
          .select("*")
          .eq("experience_id", experience.id)
          .eq("status", "confirmed");

        if (error) {
          console.error("Error fetching bookings:", error);
          continue;
        }

        const totalBookings = bookings?.length || 0;
        const totalRevenue = bookings?.reduce((sum, booking) => {
          return sum + Number(experience.price) * booking.total_participants;
        }, 0) || 0;

        stats[experience.id] = {
          totalBookings,
          totalRevenue: convertToINR(totalRevenue),
          averageRating: experience.rating || 0,
        };
      }

      return stats;
    },
    enabled: !!user && !!experiences,
  });

  const handleEditExperience = (experienceId: string) => {
    navigate(`/edit-experience/${experienceId}`);
  };

  const handleViewExperience = (experienceId: string) => {
    navigate(`/experience/${experienceId}`);
  };

  if (experiencesLoading) {
    return (
      <div className="min-h-screen bg-background">
        <Header />
        <div className="container mx-auto px-4 py-8">
          <div className="space-y-6">
            <div className="animate-pulse">
              <div className="h-8 bg-gray-200 rounded w-1/3 mb-4"></div>
              <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
                {[...Array(6)].map((_, i) => (
                  <Card key={i} className="animate-pulse">
                    <CardContent className="p-6">
                      <div className="h-4 bg-gray-200 rounded mb-3"></div>
                      <div className="h-3 bg-gray-200 rounded mb-2"></div>
                      <div className="h-3 bg-gray-200 rounded mb-4"></div>
                      <div className="grid grid-cols-2 gap-3">
                        <div className="h-3 bg-gray-200 rounded"></div>
                        <div className="h-3 bg-gray-200 rounded"></div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <Header />

      <div className="container mx-auto px-4 py-8">
        <div className="space-y-6">
          {/* Header Section */}
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
            <div>
              <h1 className="text-3xl font-bold text-gray-900 dark:text-white text-left">
                My Experiences
              </h1>
              <p className="text-gray-600 dark:text-gray-400 mt-2 text-left">
                Manage and track your experience listings
              </p>
            </div>
            <Button
              onClick={() => navigate("/create-experience")}
              className="flex items-center gap-2"
              style={{ background: "var(--brand-color)" }}
            >
              <Plus className="h-4 w-4" />
              Create New Experience
            </Button>
          </div>

          {/* Stats Overview */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <Card className="bg-gradient-to-br from-blue-50 to-indigo-50 dark:from-blue-950/20 dark:to-indigo-950/20">
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-blue-700 dark:text-blue-300">
                      Total Experiences
                    </p>
                    <p className="text-2xl font-bold text-blue-800 dark:text-blue-200">
                      {experiences?.length || 0}
                    </p>
                  </div>
                  <Eye className="h-8 w-8 text-blue-600" />
                </div>
              </CardContent>
            </Card>

            <Card className="bg-gradient-to-br from-green-50 to-emerald-50 dark:from-green-950/20 dark:to-emerald-950/20">
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-green-700 dark:text-green-300">
                      Total Bookings
                    </p>
                    <p className="text-2xl font-bold text-green-800 dark:text-green-200">
                      {Object.values(experienceStats || {}).reduce(
                        (sum: number, stat: any) => sum + stat.totalBookings,
                        0
                      )}
                    </p>
                  </div>
                  <Calendar className="h-8 w-8 text-green-600" />
                </div>
              </CardContent>
            </Card>

            <Card className="bg-gradient-to-br from-purple-50 to-violet-50 dark:from-purple-950/20 dark:to-violet-950/20">
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-purple-700 dark:text-purple-300">
                      Total Revenue
                    </p>
                    <p className="text-2xl font-bold text-purple-800 dark:text-purple-200">
                      ₹
                      {Object.values(experienceStats || {})
                        .reduce(
                          (sum: number, stat: any) => sum + stat.totalRevenue,
                          0
                        )
                        .toFixed(0)}
                    </p>
                  </div>
                  <IndianRupee className="h-8 w-8 text-purple-600" />
                </div>
              </CardContent>
            </Card>

            <Card className="bg-gradient-to-br from-orange-50 to-amber-50 dark:from-orange-950/20 dark:to-amber-950/20">
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-orange-700 dark:text-orange-300">
                      Avg Rating
                    </p>
                    <p className="text-2xl font-bold text-orange-800 dark:text-orange-200">
                      {experiences?.length
                        ? (
                            experiences.reduce(
                              (sum, exp) => sum + (exp.rating || 0),
                              0
                            ) / experiences.length
                          ).toFixed(1)
                        : "0.0"}
                    </p>
                  </div>
                  <Star className="h-8 w-8 text-orange-600" />
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Experiences Grid */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Eye className="h-6 w-6" />
                Your Experiences ({experiences?.length || 0})
              </CardTitle>
            </CardHeader>
            <CardContent>
              {experiences && experiences.length > 0 ? (
                <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
                  {experiences.map((experience) => {
                    const stats = experienceStats?.[experience.id] || {
                      totalBookings: 0,
                      totalRevenue: 0,
                      averageRating: 0,
                    };

                    return (
                      <Card
                        key={experience.id}
                        className="hover:shadow-lg transition-all duration-300 cursor-pointer group"
                        onClick={() => handleViewExperience(experience.id)}
                      >
                        <CardContent className="p-6">
                          <div className="space-y-4">
                            {/* Header with title and actions */}
                            <div className="flex items-start justify-between gap-3">
                              <h4 className="font-semibold text-lg leading-tight flex-1 min-w-0 group-hover:text-blue-600 transition-colors">
                                {experience.title}
                              </h4>
                              <Button
                                variant="ghost"
                                size="sm"
                                className="h-8 w-8 p-0 flex-shrink-0 hover:bg-blue-50 hover:text-blue-600"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  handleEditExperience(experience.id);
                                }}
                                title="Edit experience"
                              >
                                <Edit className="h-4 w-4" />
                              </Button>
                            </div>

                            {/* Category and Rating */}
                            <div className="flex items-center gap-3 flex-wrap">
                              <Badge variant="secondary" className="text-xs">
                                {experience.category}
                              </Badge>
                              <div className="flex items-center gap-1">
                                <Star className="h-4 w-4 text-yellow-500 fill-current" />
                                <span className="text-sm font-medium">
                                  {experience.rating || "0.0"}
                                </span>
                              </div>
                            </div>

                            {/* Location and Duration */}
                            <div className="space-y-2 text-sm text-gray-600 dark:text-gray-400">
                              <div className="flex items-center gap-2">
                                <MapPin className="h-4 w-4" />
                                <span className="truncate">
                                  {experience.location}
                                </span>
                              </div>
                              <div className="flex items-center gap-2">
                                <Clock className="h-4 w-4" />
                                <span>{experience.duration} hours</span>
                              </div>
                            </div>

                            {/* Stats Grid */}
                            <div className="grid grid-cols-2 gap-4 pt-4 border-t">
                              <div>
                                <p className="text-xs text-gray-500 dark:text-gray-400 mb-1">
                                  Price
                                </p>
                                <p className="font-semibold text-green-600">
                                  ₹
                                  {convertToINR(
                                    Number(experience.price)
                                  ).toFixed(0)}
                                </p>
                              </div>
                              <div>
                                <p className="text-xs text-gray-500 dark:text-gray-400 mb-1">
                                  Bookings
                                </p>
                                <p className="font-semibold">
                                  {stats.totalBookings}
                                </p>
                              </div>
                            </div>

                            <div className="grid grid-cols-2 gap-4">
                              <div>
                                <p className="text-xs text-gray-500 dark:text-gray-400 mb-1">
                                  Total Revenue
                                </p>
                                <p className="font-semibold text-blue-600">
                                  ₹{stats.totalRevenue.toFixed(0)}
                                </p>
                              </div>
                              <div>
                                <p className="text-xs text-gray-500 dark:text-gray-400 mb-1">
                                  Created
                                </p>
                                <p className="font-semibold text-xs">
                                  {format(
                                    new Date(experience.created_at),
                                    "MMM dd, yyyy"
                                  )}
                                </p>
                              </div>
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                    );
                  })}
                </div>
              ) : (
                <div className="text-center py-12">
                  <div className="w-16 h-16 mx-auto mb-4 bg-gray-100 dark:bg-gray-800 rounded-full flex items-center justify-center">
                    <Users className="h-8 w-8 text-gray-400" />
                  </div>
                  <h3 className="text-lg font-semibold mb-2">
                    No experiences yet
                  </h3>
                  <p className="text-gray-600 dark:text-gray-400 mb-6 max-w-md mx-auto">
                    Start by creating your first experience to attract customers
                    and grow your business.
                  </p>
                  <Button
                    onClick={() => navigate("/create-experience")}
                    className="flex items-center gap-2"
                  >
                    <Plus className="h-4 w-4" />
                    Create Your First Experience
                  </Button>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
};

export default VendorExperiences;