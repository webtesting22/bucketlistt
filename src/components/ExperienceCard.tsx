
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Star, Clock, Users, MapPin, Route } from "lucide-react"
import { useNavigate } from "react-router-dom"
import { useQuery } from "@tanstack/react-query"
import { supabase } from "@/integrations/supabase/client"
import { LazyImage } from "./LazyImage"
import { FavoriteButton } from "./FavoriteButton"
import { useState } from "react"

interface Category {
  id: string
  name: string
  icon?: string
  color?: string
}

interface ExperienceCardProps {
  id: string
  image: string
  title: string
  category?: string // Keep for backward compatibility
  categories?: Category[] // New prop for multiple categories
  rating: number
  reviews: string
  price: string
  originalPrice?: string
  duration?: string
  groupSize?: string
  isSpecialOffer?: boolean
  distanceKm?: number
  startPoint?: string
  endPoint?: string
}

export function ExperienceCard({
  id,
  image,
  title,
  category,
  categories,
  rating,
  reviews,
  price,
  originalPrice,
  duration,
  groupSize,
  isSpecialOffer,
  distanceKm,
  startPoint,
  endPoint
}: ExperienceCardProps) {
  const navigate = useNavigate()
  const [isClicked, setIsClicked] = useState(false)

  // Fetch primary image from experience_images if main image is not available
  const { data: primaryImage } = useQuery({
    queryKey: ['experience-primary-image', id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('experience_images')
        .select('image_url')
        .eq('experience_id', id)
        .eq('is_primary', true)
        .single()
      
      if (error) return null
      return data?.image_url || null
    },
    enabled: !image || image === '' // Only fetch if main image is not available
  })

  const handleClick = () => {
    setIsClicked(true)
    
    // Add a small delay for the animation to be visible before navigation
    setTimeout(() => {
      navigate(`/experience/${id}`)
    }, 200)
  }

  // Use categories if available, otherwise fall back to single category
  const displayCategories = categories && categories.length > 0 ? categories : (category ? [{ id: 'fallback', name: category }] : [])

  const getDistanceDisplay = () => {
    if (distanceKm === 0) return "On spot"
    if (distanceKm && startPoint && endPoint) {
      return `${distanceKm}km (${startPoint} to ${endPoint})`
    }
    if (distanceKm) return `${distanceKm}km`
    return null
  }

  // Determine which image to use
  const displayImage = image && image !== '' ? image : primaryImage || '/placeholder.svg'

  return (
    <Card 
      className={`group cursor-pointer overflow-hidden border-0 shadow-lg hover:shadow-xl transition-all duration-300 transform hover:-translate-y-2 zoom-click-animation ${isClicked ? 'zoom-in-click' : ''}`}
      onClick={handleClick}
    >
      <CardContent className="p-0">
        <div className="relative">
          {isSpecialOffer && (
            <Badge className="absolute top-3 left-3 z-10 bg-orange-500 hover:bg-orange-600">
              Special offer
            </Badge>
          )}
          <div className="absolute top-3 right-3 z-10">
            <FavoriteButton experienceId={id} />
          </div>
          <LazyImage
            src={displayImage}
            alt={title}
            className="group-hover:scale-105 transition-transform duration-200"
            aspectRatio="aspect-[4/3]"
          />
        </div>
        
        <div className="p-4 space-y-3">
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            {displayCategories.length > 0 && (
              <div className="flex flex-wrap gap-1">
                {displayCategories.slice(0, 2).map((cat, index) => (
                  <span key={cat.id || index} className="flex items-center gap-1">
                    {cat.icon && <span>{cat.icon}</span>}
                    <span>{cat.name}</span>
                    {index < Math.min(displayCategories.length, 2) - 1 && <span>•</span>}
                  </span>
                ))}
                {displayCategories.length > 2 && (
                  <span className="text-xs">+{displayCategories.length - 2} more</span>
                )}
              </div>
            )}
          </div>
          
          <h3 className="font-semibold text-lg leading-tight group-hover:text-orange-500 transition-colors">
            {title}
          </h3>
          
          <div className="flex items-center gap-4 text-sm text-muted-foreground">
            {duration && (
              <div className="flex items-center gap-1">
                <Clock className="h-4 w-4" />
                <span>{duration}</span>
              </div>
            )}
            {groupSize && (
              <div className="flex items-center gap-1">
                <Users className="h-4 w-4" />
                <span>{groupSize}</span>
              </div>
            )}
          </div>

          {getDistanceDisplay() && (
            <div className="flex items-center gap-1 text-sm text-muted-foreground">
              {distanceKm === 0 ? (
                <MapPin className="h-4 w-4" />
              ) : (
                <Route className="h-4 w-4" />
              )}
              <span>{getDistanceDisplay()}</span>
            </div>
          )}
          
          <div className="flex items-center gap-2">
            <div className="flex items-center gap-1">
              <Star className="h-4 w-4 fill-yellow-400 text-yellow-400" />
              <span className="font-medium">{rating}</span>
            </div>
            <span className="text-sm text-muted-foreground">({reviews})</span>
          </div>
          
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className="text-lg font-bold text-orange-500">{price}</span>
              {originalPrice && (
                <span className="text-sm text-muted-foreground line-through">{originalPrice}</span>
              )}
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}
