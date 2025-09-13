
import { useParams, useNavigate } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { CreateExperienceForm } from "@/components/CreateExperienceForm";
import { Header } from "@/components/Header";
import { Button } from "@/components/ui/button";
import { ArrowLeft } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { useUserRole } from "@/hooks/useUserRole";
import { useEffect } from "react";

const EditExperience = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user, loading: authLoading } = useAuth();
  const { isVendor, loading: roleLoading } = useUserRole();

  useEffect(() => {
    if (!authLoading && !roleLoading) {
      if (!user) {
        navigate('/auth');
      } else if (!isVendor) {
        navigate('/profile');
      }
    }
  }, [user, isVendor, authLoading, roleLoading, navigate]);

  const { data: experience, isLoading } = useQuery({
    queryKey: ['experience', id],
    queryFn: async () => {
      if (!id) throw new Error('Experience ID is required');
      
      const { data, error } = await supabase
        .from('experiences')
        .select(`
          *,
          experience_categories (
            category_id
          )
        `)
        .eq('id', id)
        .single();

      if (error) throw error;
      
      // Transform the data to include category_ids array
      const categoryIds = data.experience_categories?.map(ec => ec.category_id) || [];
      
      return {
        ...data,
        category_ids: categoryIds
      };
    },
    enabled: !!id
  });

  if (authLoading || roleLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">Loading...</div>
      </div>
    );
  }

  if (!user || !isVendor) {
    return null;
  }

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background">
        <Header />
        <div className="container mx-auto px-4 py-8">
          <div className="animate-pulse">
            <div className="h-8 bg-gray-300 rounded w-1/3 mb-4"></div>
            <div className="h-64 bg-gray-300 rounded"></div>
          </div>
        </div>
      </div>
    );
  }

  if (!experience) {
    return (
      <div className="min-h-screen bg-background">
        <Header />
        <div className="container mx-auto px-4 py-8">
          <div className="text-center">
            <h1 className="text-2xl font-bold mb-4">Experience Not Found</h1>
            <Button onClick={() => navigate('/profile')}>
              Back to Profile
            </Button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <Header />
      <div className="container mx-auto px-4 py-8">
        <div className="mb-6">
          <Button
            variant="ghost"
            onClick={() => navigate('/profile')}
            className="mb-4"
          >
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back to Profile
          </Button>
        </div>

        <CreateExperienceForm initialData={experience} isEditing={true} />
      </div>
    </div>
  );
};

export default EditExperience;
