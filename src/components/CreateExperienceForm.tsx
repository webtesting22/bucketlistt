import React, { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '@/contexts/AuthContext'
import { supabase } from '@/integrations/supabase/client'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Checkbox } from '@/components/ui/checkbox'
import { X, Upload } from 'lucide-react'
import { useToast } from '@/hooks/use-toast'
import { TimeSlotManager } from '@/components/TimeSlotManager'
import { DestinationDropdown } from '@/components/DestinationDropdown'

interface Category {
  id: string
  name: string
  icon: string | null
  color: string | null
}

interface TimeSlot {
  start_time: string
  end_time: string
  capacity: number
}

interface ExperienceData {
  id?: string
  title: string
  description: string
  category_ids: string[]
  original_price: number
  currency: string
  duration: string
  group_size: string
  location: string
  start_point: string
  end_point: string
  distance_km: number
  days_open: string[]
  price: number
}

interface CreateExperienceFormProps {
  initialData?: ExperienceData
  isEditing?: boolean
}

const DISTANCE_OPTIONS = [
  { value: 'on-spot', label: 'On the spot' },
  { value: '8km', label: '8km (Point A to Point B)' },
  { value: '16km', label: '16km (Point A to Point B)' },
  { value: '26km', label: '26km (Point A to Point B)' }
]

const DAYS_OF_WEEK = [
  'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'
]

export function CreateExperienceForm({ initialData, isEditing = false }: CreateExperienceFormProps) {
  const { user } = useAuth()
  const navigate = useNavigate()
  const { toast } = useToast()

  const [categories, setCategories] = useState<Category[]>([])
  const [loading, setLoading] = useState(false)
  const [selectedImages, setSelectedImages] = useState<File[]>([])
  const [previewUrls, setPreviewUrls] = useState<string[]>([])
  const [timeSlots, setTimeSlots] = useState<TimeSlot[]>([])

  const [formData, setFormData] = useState({
    title: initialData?.title || '',
    description: initialData?.description || '',
    category_ids: initialData?.category_ids || [] as string[],
    original_price: initialData?.original_price?.toString() || '',
    discount_percentage: '',
    currency: initialData?.currency || 'INR',
    duration: initialData?.duration || '',
    group_size: initialData?.group_size || '',
    location: initialData?.location || '',
    start_point: initialData?.start_point || '',
    end_point: initialData?.end_point || '',
    distance_km: initialData?.distance_km === 0 ? 'on-spot' : `${initialData?.distance_km}km` || '',
    days_open: initialData?.days_open || [] as string[],
    destination_id: initialData?.destination_id || ''
  })

  // Calculate discount percentage if we have original price and current price
  useEffect(() => {
    if (initialData?.original_price && initialData?.price && initialData.original_price > initialData.price) {
      const discount = ((initialData.original_price - initialData.price) / initialData.original_price) * 100
      setFormData(prev => ({ ...prev, discount_percentage: discount.toFixed(2) }))
    }
  }, [initialData])

  // Fetch existing time slots if editing
  useEffect(() => {
    if (isEditing && initialData?.id) {
      fetchTimeSlots(initialData.id)
    }
  }, [isEditing, initialData?.id])

  const fetchTimeSlots = async (experienceId: string) => {
    try {
      const { data, error } = await supabase
        .from('time_slots')
        .select('*')
        .eq('experience_id', experienceId)
        .order('start_time')

      if (error) throw error

      const slots = data?.map(slot => ({
        start_time: slot.start_time,
        end_time: slot.end_time,
        capacity: slot.capacity
      })) || []

      setTimeSlots(slots)
    } catch (error) {
      console.error('Error fetching time slots:', error)
    }
  }

  // Calculate final price based on original price and discount
  const calculateFinalPrice = () => {
    const originalPrice = parseFloat(formData.original_price) || 0
    const discount = parseFloat(formData.discount_percentage) || 0
    return originalPrice - (originalPrice * discount / 100)
  }

  useEffect(() => {
    fetchCategories()
  }, [])

  const fetchCategories = async () => {
    try {
      const { data, error } = await supabase
        .from('categories')
        .select('*')
        .order('name')

      if (error) throw error
      setCategories(data || [])
    } catch (error) {
      console.error('Error fetching categories:', error)
    }
  }

  const handleInputChange = (field: string, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }))
  }

  const handleDayToggle = (day: string) => {
    setFormData(prev => ({
      ...prev,
      days_open: prev.days_open.includes(day)
        ? prev.days_open.filter(d => d !== day)
        : [...prev.days_open, day]
    }))
  }

  const handleSelectAllDays = () => {
    const allSelected = formData.days_open.length === DAYS_OF_WEEK.length
    setFormData(prev => ({
      ...prev,
      days_open: allSelected ? [] : [...DAYS_OF_WEEK]
    }))
  }

  const handleImageSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(event.target.files || [])

    if (selectedImages.length + files.length > 10) {
      toast({
        title: "Too many images",
        description: "You can upload a maximum of 10 images.",
        variant: "destructive"
      })
      return
    }

    const newImages = [...selectedImages, ...files]
    setSelectedImages(newImages)

    // Create preview URLs
    const newPreviewUrls = files.map(file => URL.createObjectURL(file))
    setPreviewUrls(prev => [...prev, ...newPreviewUrls])
  }

  const removeImage = (index: number) => {
    setSelectedImages(prev => prev.filter((_, i) => i !== index))
    URL.revokeObjectURL(previewUrls[index])
    setPreviewUrls(prev => prev.filter((_, i) => i !== index))
  }

  const uploadImages = async (experienceId: string) => {
    if (selectedImages.length === 0) return null

    const uploadPromises = selectedImages.map(async (file, index) => {
      const fileExt = file.name.split('.').pop()
      const fileName = `${experienceId}/${Date.now()}_${index}.${fileExt}`

      const { data, error } = await supabase.storage
        .from('experience-images')
        .upload(fileName, file)

      if (error) throw error

      const { data: { publicUrl } } = supabase.storage
        .from('experience-images')
        .getPublicUrl(fileName)

      return {
        image_url: publicUrl,
        display_order: index,
        is_primary: index === 0,
        experience_id: experienceId
      }
    })

    const imageData = await Promise.all(uploadPromises)

    const { error } = await supabase
      .from('experience_images')
      .insert(imageData)

    if (error) throw error

    // Return the primary image URL (first image)
    return imageData[0]?.image_url || null
  }

  const updateTimeSlots = async (experienceId: string) => {
    if (timeSlots.length === 0) return

    // Delete existing time slots
    const { error: deleteError } = await supabase
      .from('time_slots')
      .delete()
      .eq('experience_id', experienceId)

    if (deleteError) throw deleteError

    // Insert new time slots
    const timeSlotsData = timeSlots.map(slot => ({
      experience_id: experienceId,
      start_time: slot.start_time,
      end_time: slot.end_time,
      capacity: slot.capacity
    }))

    const { error } = await supabase
      .from('time_slots')
      .insert(timeSlotsData)

    if (error) throw error
  }

  const createTimeSlots = async (experienceId: string) => {
    if (timeSlots.length === 0) return

    const timeSlotsData = timeSlots.map(slot => ({
      experience_id: experienceId,
      start_time: slot.start_time,
      end_time: slot.end_time,
      capacity: slot.capacity
    }))

    const { error } = await supabase
      .from('time_slots')
      .insert(timeSlotsData)

    if (error) throw error
  }

  const createExperienceCategories = async (experienceId: string, categoryIds: string[]) => {
    if (categoryIds.length === 0) return

    const experienceCategoriesData = categoryIds.map(categoryId => ({
      experience_id: experienceId,
      category_id: categoryId
    }))

    const { error } = await supabase
      .from('experience_categories')
      .insert(experienceCategoriesData)

    if (error) throw error
  }

  const updateExperienceCategories = async (experienceId: string, categoryIds: string[]) => {
    // First, delete existing category associations
    const { error: deleteError } = await supabase
      .from('experience_categories')
      .delete()
      .eq('experience_id', experienceId)

    if (deleteError) throw deleteError

    // Then create new associations
    await createExperienceCategories(experienceId, categoryIds)
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!user) {
      toast({
        title: "Authentication required",
        description: "Please sign in to " + (isEditing ? "update" : "create") + " an experience.",
        variant: "destructive"
      })
      return
    }

    if (!isEditing && selectedImages.length === 0) {
      toast({
        title: "Images required",
        description: "Please add at least one image for your experience.",
        variant: "destructive"
      })
      return
    }

    if (timeSlots.length === 0) {
      toast({
        title: "Time slots required",
        description: "Please add at least one time slot for your experience.",
        variant: "destructive"
      })
      return
    }

    setLoading(true)

    try {
      if (formData.category_ids.length === 0) {
        toast({
          title: "Categories required",
          description: "Please select at least one category for your experience.",
          variant: "destructive"
        })
        return
      }

      const finalPrice = calculateFinalPrice()

      // Get the first category name for the legacy category field
      const primaryCategory = categories.find(c => c.id === formData.category_ids[0])

      const experienceData = {
        title: formData.title,
        description: formData.description,
        category: primaryCategory?.name || 'General', // Legacy field - use first selected category
        price: finalPrice,
        original_price: formData.original_price ? parseFloat(formData.original_price) : null,
        currency: formData.currency,
        duration: formData.duration,
        group_size: formData.group_size,
        location: formData.location,
        start_point: formData.start_point,
        end_point: formData.end_point,
        distance_km: formData.distance_km === 'on-spot' ? 0 : parseInt(formData.distance_km.replace('km', '')),
        days_open: formData.days_open,
        vendor_id: user.id,
        destination_id: formData.destination_id
      }

      if (isEditing && initialData?.id) {
        // Update existing experience
        const { error: experienceError } = await supabase
          .from('experiences')
          .update(experienceData)
          .eq('id', initialData.id)

        if (experienceError) throw experienceError

        // Upload new images if any
        if (selectedImages.length > 0) {
          const primaryImageUrl = await uploadImages(initialData.id)

          if (primaryImageUrl) {
            const { error: updateError } = await supabase
              .from('experiences')
              .update({ image_url: primaryImageUrl })
              .eq('id', initialData.id)

            if (updateError) throw updateError
          }
        }

        await updateTimeSlots(initialData.id)
        await updateExperienceCategories(initialData.id, formData.category_ids)

        toast({
          title: "Experience updated successfully!",
          description: "Your experience has been updated."
        })
      } else {
        // Create new experience
        const { data: experience, error: experienceError } = await supabase
          .from('experiences')
          .insert([{ ...experienceData, image_url: '' }])
          .select()
          .single()

        if (experienceError) throw experienceError

        // Upload images and get primary image URL
        const primaryImageUrl = await uploadImages(experience.id)

        // Update the experience with the primary image URL
        if (primaryImageUrl) {
          const { error: updateError } = await supabase
            .from('experiences')
            .update({ image_url: primaryImageUrl })
            .eq('id', experience.id)

          if (updateError) throw updateError
        }

        await createTimeSlots(experience.id)
        await createExperienceCategories(experience.id, formData.category_ids)

        toast({
          title: "Experience created successfully!",
          description: "Your experience has been created with time slots and is now available."
        })
      }

      navigate('/profile')
    } catch (error) {
      console.error('Error ' + (isEditing ? 'updating' : 'creating') + ' experience:', error)
      toast({
        title: "Error " + (isEditing ? "updating" : "creating") + " experience",
        description: "Please try again later.",
        variant: "destructive"
      })
    } finally {
      setLoading(false)
    }
  }

  return (
    <Card className="max-w-4xl mx-auto">
      <CardHeader>
        <CardTitle>{isEditing ? 'Edit Experience' : 'Create New Experience'}</CardTitle>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="title">Experience Title *</Label>
              <Input
                id="title"
                value={formData.title}
                onChange={(e) => handleInputChange('title', e.target.value)}
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="categories">Categories *</Label>
              <Select
                value={formData.category_ids.length > 0 ? formData.category_ids[0] : ''}
                onValueChange={(value) => {
                  if (value && !formData.category_ids.includes(value)) {
                    setFormData(prev => ({
                      ...prev,
                      category_ids: [...prev.category_ids, value]
                    }))
                  }
                }}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select categories">
                    {formData.category_ids.length > 0 ? (
                      <div className="flex flex-wrap gap-1">
                        {formData.category_ids.map(categoryId => {
                          const category = categories.find(c => c.id === categoryId)
                          return category ? (
                            <span key={categoryId} className="inline-flex items-center gap-1 px-2 py-1 bg-orange-100 text-orange-800 text-xs rounded-md">
                              {category.icon && <span>{category.icon}</span>}
                              {category.name}
                              <X
                                className="h-3 w-3 ml-1 cursor-pointer hover:text-orange-600"
                                onClick={(e) => {
                                  e.preventDefault()
                                  e.stopPropagation()
                                  setFormData(prev => ({
                                    ...prev,
                                    category_ids: prev.category_ids.filter(id => id !== categoryId)
                                  }))
                                }}
                              />
                            </span>
                          ) : null
                        })}
                      </div>
                    ) : (
                      "Select categories"
                    )}
                  </SelectValue>
                </SelectTrigger>
                <SelectContent>
                  {categories
                    .filter(category => !formData.category_ids.includes(category.id))
                    .map((category) => (
                      <SelectItem key={category.id} value={category.id}>
                        <div className="flex items-center gap-2">
                          {category.icon && <span>{category.icon}</span>}
                          {category.name}
                        </div>
                      </SelectItem>
                    ))}
                  {categories.filter(category => !formData.category_ids.includes(category.id)).length === 0 && (
                    <div className="px-2 py-1 text-sm text-muted-foreground">
                      All categories selected
                    </div>
                  )}
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="description">Description *</Label>
            <Textarea
              id="description"
              value={formData.description}
              onChange={(e) => handleInputChange('description', e.target.value)}
              rows={4}
              required
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="space-y-2">
              <Label htmlFor="original_price">Original Price *</Label>
              <Input
                id="original_price"
                type="number"
                step="0.01"
                value={formData.original_price}
                onChange={(e) => handleInputChange('original_price', e.target.value)}
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="discount_percentage">Discount Percentage</Label>
              <Input
                id="discount_percentage"
                type="number"
                min="0"
                max="100"
                step="0.01"
                value={formData.discount_percentage}
                onChange={(e) => handleInputChange('discount_percentage', e.target.value)}
                placeholder="0"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="currency">Currency</Label>
              <Select
                value={formData.currency}
                onValueChange={(value) => handleInputChange('currency', value)}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="INR">INR (₹)</SelectItem>
                  <SelectItem value="USD">USD ($)</SelectItem>
                  <SelectItem value="EUR">EUR (€)</SelectItem>
                  <SelectItem value="GBP">GBP (£)</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          {formData.original_price && (
            <div className="bg-gray-50 p-4 rounded-lg">
              <div className="text-sm text-gray-600">Final Price Preview:</div>
              <div className="text-lg font-semibold text-green-600">
                {formData.currency === 'INR' ? '₹' :
                  formData.currency === 'USD' ? '₹' :
                    formData.currency === 'EUR' ? '€' : '£'}
                {calculateFinalPrice().toFixed(2)}
                {formData.discount_percentage && parseFloat(formData.discount_percentage) > 0 && (
                  <span className="text-sm text-green-600 ml-2">
                    ({formData.discount_percentage}% off)
                  </span>
                )}
              </div>
            </div>
          )}

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="duration">Duration</Label>
              <Input
                id="duration"
                value={formData.duration}
                onChange={(e) => handleInputChange('duration', e.target.value)}
                placeholder="e.g., 2 hours, Half day"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="group_size">Group Size</Label>
              <Input
                id="group_size"
                value={formData.group_size}
                onChange={(e) => handleInputChange('group_size', e.target.value)}
                placeholder="e.g., Up to 10 people"
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="location">Address *</Label>
            <Input
              id="location"
              value={formData.location}
              onChange={(e) => handleInputChange('location', e.target.value)}
              required
            />
          </div>

          <div>
            <DestinationDropdown
              value={formData.destination_id}
              onValueChange={(value) => handleInputChange('destination_id', value)}
              required={true}
              className=""
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="distance">Distance *</Label>
            <Select
              value={formData.distance_km}
              onValueChange={(value) => handleInputChange('distance_km', value)}
              required
            >
              <SelectTrigger>
                <SelectValue placeholder="Select distance" />
              </SelectTrigger>
              <SelectContent>
                {DISTANCE_OPTIONS.map((option) => (
                  <SelectItem key={option.value} value={option.value}>
                    {option.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {formData.distance_km && formData.distance_km !== 'on-spot' && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="start_point">Start Point</Label>
                <Input
                  id="start_point"
                  value={formData.start_point}
                  onChange={(e) => handleInputChange('start_point', e.target.value)}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="end_point">End Point</Label>
                <Input
                  id="end_point"
                  value={formData.end_point}
                  onChange={(e) => handleInputChange('end_point', e.target.value)}
                />
              </div>
            </div>
          )}

          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <Label>Days Open *</Label>
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={handleSelectAllDays}
              >
                {formData.days_open.length === DAYS_OF_WEEK.length ? 'Deselect All' : 'Select All'}
              </Button>
            </div>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
              {DAYS_OF_WEEK.map((day) => (
                <div key={day} className="flex items-center space-x-2">
                  <Checkbox
                    id={day}
                    checked={formData.days_open.includes(day)}
                    onCheckedChange={() => handleDayToggle(day)}
                  />
                  <Label htmlFor={day} className="text-sm">{day}</Label>
                </div>
              ))}
            </div>
          </div>

          {/* Time Slots Section */}
          <TimeSlotManager
            timeSlots={timeSlots}
            onChange={setTimeSlots}
          />

          {!isEditing && (
            <div className="space-y-3">
              <Label>Images * (Max 10)</Label>
              <div className="border-2 border-dashed border-gray-300 rounded-lg p-6">
                <input
                  type="file"
                  accept="image/*"
                  multiple
                  onChange={handleImageSelect}
                  className="hidden"
                  id="image-upload"
                />
                <label
                  htmlFor="image-upload"
                  className="flex flex-col items-center cursor-pointer"
                >
                  <Upload className="h-8 w-8 text-gray-400 mb-2" />
                  <span className="text-sm text-gray-600">
                    Click to upload images ({selectedImages.length}/10)
                  </span>
                </label>
              </div>

              {previewUrls.length > 0 && (
                <div className="grid grid-cols-2 md:grid-cols-5 gap-4 mt-4">
                  {previewUrls.map((url, index) => (
                    <div key={index} className="relative">
                      <img
                        src={url}
                        alt={`Preview ${index + 1}`}
                        className="w-full h-24 object-cover rounded-lg"
                      />
                      <button
                        type="button"
                        onClick={() => removeImage(index)}
                        className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full p-1"
                      >
                        <X className="h-4 w-4" />
                      </button>
                      {index === 0 && (
                        <span className="absolute bottom-1 left-1 bg-blue-500 text-white text-xs px-1 rounded">
                          Primary
                        </span>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {isEditing && (
            <div className="space-y-3">
              <Label>Add New Images (Optional)</Label>
              <div className="border-2 border-dashed border-gray-300 rounded-lg p-6">
                <input
                  type="file"
                  accept="image/*"
                  multiple
                  onChange={handleImageSelect}
                  className="hidden"
                  id="image-upload"
                />
                <label
                  htmlFor="image-upload"
                  className="flex flex-col items-center cursor-pointer"
                >
                  <Upload className="h-8 w-8 text-gray-400 mb-2" />
                  <span className="text-sm text-gray-600">
                    Click to upload new images ({selectedImages.length}/10)
                  </span>
                </label>
              </div>

              {previewUrls.length > 0 && (
                <div className="grid grid-cols-2 md:grid-cols-5 gap-4 mt-4">
                  {previewUrls.map((url, index) => (
                    <div key={index} className="relative">
                      <img
                        src={url}
                        alt={`Preview ${index + 1}`}
                        className="w-full h-24 object-cover rounded-lg"
                      />
                      <button
                        type="button"
                        onClick={() => removeImage(index)}
                        className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full p-1"
                      >
                        <X className="h-4 w-4" />
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {!isEditing && (
            <div className="space-y-2">
              <div className="flex items-center space-x-2">
                <Checkbox
                  id="terms"
                  required
                />
                <Label htmlFor="terms" className="text-sm font-normal cursor-pointer">
                  I agree to the{' '}
                  <a
                    href="/terms"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="p-0 h-auto text-orange-500 hover:text-orange-600"
                  >
                    Terms & Conditions
                  </a>
                </Label>
              </div>
            </div>
          )}

          <Button
            type="submit"
            disabled={loading || (!isEditing && selectedImages.length === 0) || timeSlots.length === 0}
            className="w-full"
          >
            {loading ? (isEditing ? 'Updating Experience...' : 'Creating Experience...') : (isEditing ? 'Update Experience' : 'Create Experience')}
          </Button>
        </form>
      </CardContent>
    </Card>
  )
}
