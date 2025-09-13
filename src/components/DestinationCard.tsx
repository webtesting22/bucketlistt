
import { Card, CardContent } from "@/components/ui/card"
import { useNavigate } from "react-router-dom"
import { LazyImage } from "./LazyImage"
import { useState } from "react"

interface DestinationCardProps {
  id: string
  image: string
  title: string
  subtitle: string
}

export function DestinationCard({ id, image, title, subtitle }: DestinationCardProps) {
  const navigate = useNavigate()
  const [isClicked, setIsClicked] = useState(false)

  const handleClick = () => {
    setIsClicked(true)
    
    // Add a small delay for the animation to be visible before navigation
    setTimeout(() => {
      navigate(`/destination/${id}`)
    }, 200)
  }

  return (
    <Card 
      className={`group cursor-pointer overflow-hidden border-0 shadow-lg hover:shadow-xl transition-all duration-300 transform hover:-translate-y-2 zoom-click-animation ${isClicked ? 'zoom-in-click' : ''}`} 
      onClick={handleClick}
    >
      <CardContent className="p-0 relative">
        <LazyImage
          src={image}
          alt={title}
          className="group-hover:scale-105 transition-transform duration-200"
          aspectRatio="aspect-[4/3]"
        />
        <div className="absolute bottom-0 left-0 right-0 p-4 bg-gradient-to-t from-black/60 to-transparent text-white">
          <p className="text-sm opacity-90 mb-1">{subtitle}</p>
          <h3 className="text-lg font-semibold">{title}</h3>
        </div>
      </CardContent>
    </Card>
  )
}
