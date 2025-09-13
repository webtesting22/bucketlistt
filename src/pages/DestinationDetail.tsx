import { useParams, useNavigate } from "react-router-dom"
import { useQuery } from "@tanstack/react-query"
import { supabase } from "@/integrations/supabase/client"
import { Header } from "@/components/Header"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { ExperienceCard } from "@/components/ExperienceCard"
import { LazyImage } from "@/components/LazyImage"
import { DetailedItinerary } from "@/components/DetailedItinerary"
import { ArrowLeft, Star, MapPin, Clock, Thermometer, Calendar, Users, Filter, ArrowUpDown } from "lucide-react"
import { useState, useEffect } from "react"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"

type SortOption = 'rating' | 'price_low' | 'price_high' | 'newest' | 'name'

const DestinationDetail = () => {
  const { id } = useParams()
  const navigate = useNavigate()
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null)
  const [sortBy, setSortBy] = useState<SortOption>('rating')
  const [isAnimated, setIsAnimated] = useState(false)

  // Scroll to top and trigger animations when component mounts
  useEffect(() => {
    window.scrollTo(0, 0)
    const timer = setTimeout(() => {
      setIsAnimated(true)
    }, 100)
    return () => clearTimeout(timer)
  }, [])

  const { data: destination, isLoading: destinationLoading } = useQuery({
    queryKey: ['destination', id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('destinations')
        .select('*')
        .eq('id', id)
        .single()
      
      if (error) throw error
      return data
    },
    enabled: !!id
  })

  const { data: categories } = useQuery({
    queryKey: ['categories'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('categories')
        .select('*')
        .order('name')
      
      if (error) throw error
      return data
    }
  })

  const { data: experiences, isLoading: experiencesLoading } = useQuery({
    queryKey: ['destination-experiences', id, selectedCategory, sortBy],
    queryFn: async () => {
      let query = supabase
        .from('experiences')
        .select(`
          *,
          experience_categories (
            categories (
              id,
              name,
              icon,
              color
            )
          )
        `)
        .eq('destination_id', id)
      
      if (selectedCategory) {
        // Filter by category using the junction table
        const { data: experienceIds, error: categoryError } = await supabase
          .from('experience_categories')
          .select('experience_id')
          .eq('category_id', selectedCategory)
        
        if (categoryError) throw categoryError
        
        const ids = experienceIds.map(item => item.experience_id)
        if (ids.length > 0) {
          query = query.in('id', ids)
        } else {
          // No experiences found for this category
          return []
        }
      }
      
      // Apply sorting
      switch (sortBy) {
        case 'rating':
          query = query.order('rating', { ascending: false })
          break
        case 'price_low':
          query = query.order('price', { ascending: true })
          break
        case 'price_high':
          query = query.order('price', { ascending: false })
          break
        case 'newest':
          query = query.order('created_at', { ascending: false })
          break
        case 'name':
          query = query.order('title', { ascending: true })
          break
        default:
          query = query.order('rating', { ascending: false })
      }
      
      const { data, error } = await query
      
      if (error) throw error
      return data
    },
    enabled: !!id
  })

  const { data: attractions } = useQuery({
    queryKey: ['destination-attractions', id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('attractions')
        .select('*')
        .eq('destination_id', id)
        .order('title')
      
      if (error) throw error
      return data
    },
    enabled: !!id
  })

  if (destinationLoading) {
    return (
      <div className="min-h-screen bg-background">
        <Header />
        <div className="container py-16 px-4">
          <div className="text-center">
            <div className="animate-pulse space-y-4">
              <div className="h-8 bg-muted rounded w-64 mx-auto"></div>
              <div className="h-4 bg-muted rounded w-48 mx-auto"></div>
            </div>
          </div>
        </div>
      </div>
    )
  }

  if (!destination) {
    return (
      <div className="min-h-screen bg-background">
        <Header />
        <div className="container py-16 px-4">
          <div className="text-center">
            <div className="scroll-fade-in animate">
              <h1 className="text-2xl font-bold mb-2">Destination not found</h1>
              <p className="text-muted-foreground">The destination you're looking for doesn't exist.</p>
            </div>
          </div>
        </div>
      </div>
    )
  }

  const weatherInfo = destination.weather_info as any

  return (
    <div className="min-h-screen bg-background">
      <Header />
      
      {/* Destination Header Section */}
      <section className="section-wrapper section-bg-primary">
        <div className="container">
          <div className={`scroll-fade-in ${isAnimated ? 'animate' : ''}`}>
            <Button 
              variant="ghost" 
              onClick={() => navigate('/')}
              className="mb-6 hover:bg-accent"
            >
              <ArrowLeft className="mr-2 h-4 w-4" />
              Back to Home
            </Button>
          </div>

          {/* Destination Header */}
          <div className={`grid grid-cols-1 lg:grid-cols-2 gap-8 scroll-fade-in ${isAnimated ? 'animate' : ''}`} style={{ animationDelay: '0.1s' }}>
          <LazyImage
            src={destination.image_url || ''}
            alt={destination.title}
            aspectRatio="aspect-[4/3]"
            className="rounded-xl"
          />

          <div className="space-y-6">
            <div>
              <h1 className="text-4xl font-bold mb-2">{destination.title}</h1>
              <p className="text-xl text-muted-foreground mb-4">{destination.subtitle}</p>
              
              {destination.description && (
                <p className="text-muted-foreground leading-relaxed mb-6">
                  {destination.description}
                </p>
              )}

              <div className="grid grid-cols-2 gap-4">
                {destination.best_time_to_visit && (
                  <div className="flex items-center gap-2">
                    <Calendar className="h-5 w-5 text-brand-primary" />
                    <div>
                      <p className="text-sm text-muted-foreground">Best time to visit</p>
                      <p className="font-medium">{destination.best_time_to_visit}</p>
                    </div>
                  </div>
                )}
                
                {destination.recommended_duration && (
                  <div className="flex items-center gap-2">
                    <Clock className="h-5 w-5 text-brand-primary" />
                    <div>
                      <p className="text-sm text-muted-foreground">Recommended duration</p>
                      <p className="font-medium">{destination.recommended_duration}</p>
                    </div>
                  </div>
                )}
                
                {destination.timezone && (
                  <div className="flex items-center gap-2">
                    <MapPin className="h-5 w-5 text-brand-primary" />
                    <div>
                      <p className="text-sm text-muted-foreground">Timezone</p>
                      <p className="font-medium">{destination.timezone}</p>
                    </div>
                  </div>
                )}
                
                {weatherInfo && (
                  <div className="flex items-center gap-2">
                    <Thermometer className="h-5 w-5 text-brand-primary" />
                    <div>
                      <p className="text-sm text-muted-foreground">Weather</p>
                      <p className="font-medium">{weatherInfo.nov_apr?.temp} (Cool season)</p>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
        </div>
      </section>

      {/* Must-Visit Attractions */}
      {attractions && attractions.length > 0 && (
        <section className="section-wrapper section-bg-secondary">
          <div className="container">
            <div className={`scroll-fade-in ${isAnimated ? 'animate' : ''}`} style={{ animationDelay: '0.2s' }}>
              <h2 className="text-2xl font-bold mb-6">Must-visit tourist spots</h2>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                {attractions.map((attraction, index) => (
                  <div 
                    key={attraction.id} 
                    className={`group cursor-pointer scroll-scale-in ${isAnimated ? 'animate' : ''}`}
                    style={{ animationDelay: `${0.3 + index * 0.1}s` }}
                  >
                    <LazyImage
                      src={attraction.image_url || ''}
                      alt={attraction.title}
                      aspectRatio="aspect-[4/3]"
                      className="rounded-lg mb-3 group-hover:scale-105 transition-transform duration-300"
                    />
                    <h3 className="font-semibold mb-1">{attraction.title}</h3>
                    <p className="text-sm text-muted-foreground line-clamp-2">{attraction.description}</p>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </section>
      )}

      {/* Detailed Itinerary */}
      <section className="section-wrapper section-bg-tertiary">
        <div className="container">
          <div className={`scroll-fade-in ${isAnimated ? 'animate' : ''}`} style={{ animationDelay: '0.3s' }}>
            <DetailedItinerary destinationName={destination.title} />
          </div>
        </div>
      </section>

      {/* Things to Do Section */}
      <section className="section-wrapper section-bg-primary">
        <div className="container">
          {/* Category Filters and Sorting */}
          <div className={`mb-8 scroll-fade-in ${isAnimated ? 'animate' : ''}`} style={{ animationDelay: '0.4s' }}>
            <div className="flex items-center justify-between mb-6">
              <div className="flex items-center gap-4">
                <Filter className="h-5 w-5 text-brand-primary" />
                <h2 className="text-2xl font-bold">Things to do</h2>
              </div>
              
              <div className="flex items-center gap-2">
                <ArrowUpDown className="h-4 w-4 text-muted-foreground" />
                <Select value={sortBy} onValueChange={(value: SortOption) => setSortBy(value)}>
                  <SelectTrigger className="w-48">
                    <SelectValue placeholder="Sort by" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="rating">Highest rated</SelectItem>
                    <SelectItem value="price_low">Price: Low to High</SelectItem>
                    <SelectItem value="price_high">Price: High to Low</SelectItem>
                    <SelectItem value="newest">Newest first</SelectItem>
                    <SelectItem value="name">Name A-Z</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            
            <div className="flex flex-wrap gap-3 mb-8">
              <Button
                variant={selectedCategory === null ? "default" : "outline"}
                onClick={() => setSelectedCategory(null)}
                className={selectedCategory === null ? "bg-brand-primary hover:bg-brand-primary-dark" : ""}
              >
                All
              </Button>
              {categories?.map((category) => (
                <Button
                  key={category.id}
                  variant={selectedCategory === category.id ? "default" : "outline"}
                  onClick={() => setSelectedCategory(category.id)}
                  className={selectedCategory === category.id ? "bg-brand-primary hover:bg-brand-primary-dark" : ""}
                >
                  <span className="mr-2">{category.icon}</span>
                  {category.name}
                </Button>
              ))}
            </div>
          </div>

          {/* Activities Grid */}
          <div className={`scroll-fade-in ${isAnimated ? 'animate' : ''}`} style={{ animationDelay: '0.5s' }}>
            {experiencesLoading ? (
              <div className="text-center py-12">
                <div className="animate-pulse space-y-4">
                  <div className="h-6 bg-muted rounded w-48 mx-auto"></div>
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                    {[...Array(8)].map((_, i) => (
                      <div key={i} className="space-y-3">
                        <div className="h-48 bg-muted rounded-lg"></div>
                        <div className="h-4 bg-muted rounded w-3/4"></div>
                        <div className="h-4 bg-muted rounded w-1/2"></div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            ) : experiences && experiences.length > 0 ? (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                {experiences.map((experience, index) => (
                  <div 
                    key={experience.id}
                    className={`scroll-scale-in ${isAnimated ? 'animate' : ''}`}
                    style={{ animationDelay: `${0.6 + index * 0.05}s` }}
                  >
                    <ExperienceCard
                      id={experience.id}
                      image={experience.image_url || ''}
                      title={experience.title}
                      categories={experience.experience_categories?.map(ec => ec.categories) || []}
                      rating={Number(experience.rating)}
                      reviews={experience.reviews_count?.toString() || '0'}
                      price={`From ${experience.currency === 'USD' ? '₹' : experience.currency} ${experience.price}`}
                      originalPrice={experience.original_price ? `${experience.currency === 'USD' ? '₹' : experience.currency} ${experience.original_price}` : undefined}
                      duration={experience.duration || undefined}
                      groupSize={experience.group_size || undefined}
                      isSpecialOffer={experience.is_special_offer || false}
                    />
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-12">
                <div className={`scroll-fade-in ${isAnimated ? 'animate' : ''}`} style={{ animationDelay: '0.6s' }}>
                  <p className="text-muted-foreground">No activities found for this category. But we'll surely add some later.</p>
                </div>
              </div>
            )}
          </div>
        </div>
      </section>
    </div>
  )
}

export default DestinationDetail