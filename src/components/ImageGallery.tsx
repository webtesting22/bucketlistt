
import { useState } from 'react'
import { LazyImage } from './LazyImage'
import { Button } from './ui/button'
import { ChevronLeft, ChevronRight, X } from 'lucide-react'
import { cn } from '@/lib/utils'
import { Swiper, SwiperSlide } from 'swiper/react'
import { Autoplay, Navigation, Pagination } from 'swiper/modules'
import 'swiper/css'
import 'swiper/css/navigation'
import 'swiper/css/pagination'
import "../Styles/ExperienceDetail.css"
interface ImageGalleryProps {
  images: Array<{
    id: string
    image_url: string
    alt_text?: string
    display_order: number
    is_primary?: boolean
  }>
  experienceTitle: string
}

export function ImageGallery({ images, experienceTitle }: ImageGalleryProps) {
  const [selectedImageIndex, setSelectedImageIndex] = useState(0)
  const [isModalOpen, setIsModalOpen] = useState(false)

  // Sort images by display_order, with primary image first
  const sortedImages = [...images].sort((a, b) => {
    if (a.is_primary && !b.is_primary) return -1
    if (!a.is_primary && b.is_primary) return 1
    return a.display_order - b.display_order
  })

  const openModal = (index: number) => {
    setSelectedImageIndex(index)
    setIsModalOpen(true)
  }

  const closeModal = () => {
    setIsModalOpen(false)
  }

  const goToPrevious = () => {
    setSelectedImageIndex((prev) =>
      prev === 0 ? sortedImages.length - 1 : prev - 1
    )
  }

  const goToNext = () => {
    setSelectedImageIndex((prev) =>
      prev === sortedImages.length - 1 ? 0 : prev + 1
    )
  }

  if (sortedImages.length === 0) {
    return (
      <div className="aspect-[3/2] bg-muted rounded-xl flex items-center justify-center">
        <span className="text-muted-foreground">No images available</span>
      </div>
    )
  }

  const mainImage = sortedImages[0]
  const thumbnailImages = sortedImages.slice(1, 5) // Show up to 4 additional thumbnails

  return (
    <>
      <div className=" container">
        {/* Main Image Swiper */}
        <div className="relative MainShowingImageContainer">
          <Swiper
            modules={[Autoplay, Navigation, Pagination]}
            autoplay={{
              delay: 3000,
              disableOnInteraction: false,
            }}
            // navigation={true}
            // pagination={{
            //   clickable: true,
            //   bulletClass: 'swiper-pagination-bullet',
            //   bulletActiveClass: 'swiper-pagination-bullet-active',
            // }}
            loop={sortedImages.length > 1}
            className="rounded-xl overflow-hidden"
          >
            {sortedImages.map((image, index) => (
              <SwiperSlide key={image.id}>
                <div
                  className="cursor-pointer"
                  id="SwiperInsideImages"
                // onClick={() => openModal(index)}
                >
                  <LazyImage
                    src={image.image_url}
                    alt={image.alt_text || `${experienceTitle} ${index + 1}`}
                    aspectRatio="aspect-[3/2]"

                    className="rounded-xl w-full h-full object-cover"
                  />
                </div>
              </SwiperSlide>
            ))}
          </Swiper>
          {sortedImages.length > 1 && (
            <div className="absolute bottom-4 right-4 bg-black/50 text-white px-3 py-1 rounded-full text-sm z-10">
              {sortedImages.length} images
            </div>
          )}
        </div>

        {/* Thumbnail Grid */}
        {/* {thumbnailImages.length > 0 && (
          <div className="grid grid-cols-4 gap-3">
            {thumbnailImages.map((image, index) => (
              <div key={image.id} className="relative">
                <LazyImage
                  src={image.image_url}
                  alt={image.alt_text || `${experienceTitle} ${index + 2}`}
                  aspectRatio="aspect-auto"
                  className="rounded-lg cursor-pointer hover:opacity-80 transition-opacity h-24 object-cover"
                  onClick={() => openModal(index + 1)}
                />
                {index === 3 && sortedImages.length > 5 && (
                  <div
                    className="absolute inset-0 bg-black/60 rounded-lg flex items-center justify-center cursor-pointer"
                    onClick={() => openModal(index + 1)}
                  >
                    <span className="text-white font-semibold">
                      +{sortedImages.length - 4}
                    </span>
                  </div>
                )}
              </div>
            ))}
          </div>
        )} */}
      </div>

      {/* Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-black/90 z-50 flex items-center justify-center ">
          <div className="relative w-full h-full flex items-center justify-center p-4">
            {/* Close Button */}
            <Button
              variant="ghost"
              size="icon"
              className="absolute top-4 right-4 text-white hover:bg-white/20 z-10"
              onClick={closeModal}
            >
              <X className="h-6 w-6" />
            </Button>

            {/* Navigation Buttons */}
            {sortedImages.length > 1 && (
              <>
                <Button
                  variant="ghost"
                  size="icon"
                  className="absolute left-4 top-1/2 -translate-y-1/2 text-white hover:bg-white/20 z-10"
                  onClick={goToPrevious}
                >
                  <ChevronLeft className="h-8 w-8" />
                </Button>
                <Button
                  variant="ghost"
                  size="icon"
                  className="absolute right-4 top-1/2 -translate-y-1/2 text-white hover:bg-white/20 z-10"
                  onClick={goToNext}
                >
                  <ChevronRight className="h-8 w-8" />
                </Button>
              </>
            )}

            {/* Main Image */}
            <div className="max-w-4xl max-h-full">
              <img
                src={sortedImages[selectedImageIndex].image_url}
                alt={sortedImages[selectedImageIndex].alt_text || experienceTitle}
                className="max-w-full max-h-full object-contain"
              />
            </div>

            {/* Image Counter */}
            <div className="absolute bottom-4 left-1/2 -translate-x-1/2 bg-black/50 text-white px-4 py-2 rounded-full">
              {selectedImageIndex + 1} / {sortedImages.length}
            </div>
          </div>
        </div>
      )}
    </>
  )
}
