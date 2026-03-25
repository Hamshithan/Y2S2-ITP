import { useState, useEffect } from 'react'
import { Star, User, ThumbsUp, MessageSquare, TrendingUp, Truck, Plus, Pencil, Trash2 } from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs'
import { Separator } from '@/components/ui/separator'
import { Button } from '@/components/ui/button'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { reviewsAPI, driversAPI, parcelsAPI } from '@/services/api'

const StarRating = ({ rating, size = 'sm', onRate }) => {
  const sizeClass = size === 'lg' ? 'h-6 w-6' : 'h-4 w-4'
  return (
    <div className="flex items-center gap-0.5">
      {[1, 2, 3, 4, 5].map((star) => (
        <button
          key={star}
          type="button"
          onClick={() => onRate && onRate(star)}
          className={onRate ? 'cursor-pointer hover:scale-110 transition-transform' : 'cursor-default'}
        >
          <Star
            className={`${sizeClass} ${
              star <= rating 
                ? 'fill-yellow-400 text-yellow-400' 
                : 'fill-transparent text-muted-foreground/30'
            }`}
          />
        </button>
      ))}
    </div>
  )
}

export default function Reviews() {
  const [reviews, setReviews] = useState([])
  const [drivers, setDrivers] = useState([])
  const [parcels, setParcels] = useState([])
  const [loading, setLoading] = useState(true)
  const [isDialogOpen, setIsDialogOpen] = useState(false)
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false)
  const [editingReview, setEditingReview] = useState(null)
  const [deletingReviewId, setDeletingReviewId] = useState(null)
  const [formData, setFormData] = useState({
    customer_name: '',
    rating: 5,
    comment: '',
    driver_id: '',
    parcel_id: ''
  })

  useEffect(() => {
    fetchReviews()
    fetchDrivers()
    fetchParcels()
  }, [])

  const fetchReviews = async () => {
    try {
      const data = await reviewsAPI.getAll()
      setReviews(data)
    } catch (error) {
      console.error('Error fetching reviews:', error)
    } finally {
      setLoading(false)
    }
  }

  const fetchDrivers = async () => {
    try {
      const data = await driversAPI.getAll()
      setDrivers(data)
    } catch (error) {
      console.error('Error fetching drivers:', error)
    }
  }

  const fetchParcels = async () => {
    try {
      const data = await parcelsAPI.getAll()
      setParcels(data)
    } catch (error) {
      console.error('Error fetching parcels:', error)
    }
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    try {
      if (editingReview) {
        await reviewsAPI.update(editingReview.id, formData)
      } else {
        await reviewsAPI.create(formData)
      }
      setIsDialogOpen(false)
      setEditingReview(null)
      setFormData({ customer_name: '', rating: 5, comment: '', driver_id: '', parcel_id: '' })
      fetchReviews()
    } catch (error) {
      console.error('Error saving review:', error)
      alert('Failed to save review')
    }
  }

  const handleEdit = (review) => {
    setEditingReview(review)
    setFormData({
      customer_name: review.customer_name,
      rating: review.rating,
      comment: review.comment,
      driver_id: review.driver_id?.toString() || '',
      parcel_id: review.parcel_id?.toString() || ''
    })
    setIsDialogOpen(true)
  }

  const openDeleteDialog = (id) => {
    setDeletingReviewId(id)
    setIsDeleteDialogOpen(true)
  }

  const handleDelete = async () => {
    if (!deletingReviewId) return
    try {
      await reviewsAPI.delete(deletingReviewId)
      setIsDeleteDialogOpen(false)
      setDeletingReviewId(null)
      fetchReviews()
    } catch (error) {
      console.error('Error deleting review:', error)
      alert('Failed to delete review')
    }
  }

  const handleMarkHelpful = async (id) => {
    try {
      await reviewsAPI.markHelpful(id)
      fetchReviews()
    } catch (error) {
      console.error('Error marking helpful:', error)
    }
  }

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    })
  }

  const averageRating = reviews.length > 0 
    ? (reviews.reduce((sum, r) => sum + r.rating, 0) / reviews.length).toFixed(1)
    : '0.0'
  
  const ratingDistribution = [5, 4, 3, 2, 1].map(stars => ({
    stars,
    count: reviews.filter(r => r.rating === stars).length,
    percentage: reviews.length > 0 ? Math.round((reviews.filter(r => r.rating === stars).length / reviews.length) * 100) : 0
  }))

  const driverRatings = drivers.map(driver => ({
    name: driver.name,
    trips: driver.completed_deliveries || 0,
    rating: driver.rating || 4.5,
    reviews: reviews.filter(r => r.driver_id === driver.id).length
  }))

  if (loading) {
    return <div className="text-muted-foreground">Loading...</div>
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold text-foreground">Customer Reviews & Ratings</h1>
          <p className="text-muted-foreground mt-1">Monitor customer feedback and driver performance</p>
        </div>
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogTrigger asChild>
            <Button 
              className="bg-primary text-primary-foreground hover:bg-primary/90"
              onClick={() => {
                setEditingReview(null)
                setFormData({ customer_name: '', rating: 5, comment: '', driver_id: '', parcel_id: '' })
              }}
            >
              <Plus className="h-4 w-4 mr-2" />
              Add Review
            </Button>
          </DialogTrigger>
          <DialogContent className="bg-muted border-border text-foreground max-w-lg">
            <DialogHeader>
              <DialogTitle>{editingReview ? 'Edit Review' : 'Add New Review'}</DialogTitle>
            </DialogHeader>
            <form onSubmit={handleSubmit} className="space-y-4 mt-4">
              <div>
                <Label htmlFor="customer_name">Customer Name</Label>
                <Input
                  id="customer_name"
                  value={formData.customer_name}
                  onChange={(e) => setFormData({ ...formData, customer_name: e.target.value })}
                  className="bg-card border-border text-foreground"
                  required
                />
              </div>
              <div>
                <Label>Rating</Label>
                <div className="mt-2">
                  <StarRating rating={formData.rating} size="lg" onRate={(rating) => setFormData({ ...formData, rating })} />
                </div>
              </div>
              <div>
                <Label htmlFor="driver">Driver</Label>
                <Select 
                  value={formData.driver_id} 
                  onValueChange={(value) => setFormData({ ...formData, driver_id: value })}
                >
                  <SelectTrigger className="bg-card border-border text-foreground">
                    <SelectValue placeholder="Select driver" />
                  </SelectTrigger>
                  <SelectContent className="bg-muted border-border">
                    {drivers.map(driver => (
                      <SelectItem key={driver.id} value={driver.id.toString()}>{driver.name}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label htmlFor="parcel">Parcel</Label>
                <Select 
                  value={formData.parcel_id} 
                  onValueChange={(value) => setFormData({ ...formData, parcel_id: value })}
                >
                  <SelectTrigger className="bg-card border-border text-foreground">
                    <SelectValue placeholder="Select parcel" />
                  </SelectTrigger>
                  <SelectContent className="bg-muted border-border">
                    {parcels.map(parcel => (
                      <SelectItem key={parcel.id} value={parcel.id.toString()}>{parcel.tracking_id}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label htmlFor="comment">Comment</Label>
                <Textarea
                  id="comment"
                  value={formData.comment}
                  onChange={(e) => setFormData({ ...formData, comment: e.target.value })}
                  className="bg-card border-border text-foreground"
                  rows={3}
                  required
                />
              </div>
              <div className="flex gap-2 pt-4">
                <Button type="submit" className="bg-primary text-primary-foreground hover:bg-primary/90">
                  {editingReview ? 'Update' : 'Add'} Review
                </Button>
                <Button 
                  type="button" 
                  variant="outline" 
                  onClick={() => setIsDialogOpen(false)}
                  className="border-border text-foreground"
                >
                  Cancel
                </Button>
              </div>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      {/* Overview Stats */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card className="border-border bg-card">
          <CardContent className="p-4">
            <div className="flex items-center gap-4">
              <div className="h-10 w-10 rounded-lg bg-muted flex items-center justify-center">
                <Star className="h-5 w-5 text-muted-foreground" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <span className="text-2xl font-bold text-foreground">{averageRating}</span>
                  <span className="text-sm text-muted-foreground">/ 5</span>
                </div>
                <p className="text-xs text-muted-foreground">Average Rating</p>
              </div>
            </div>
            <div className="mt-3">
              <StarRating rating={Math.round(parseFloat(averageRating))} />
            </div>
          </CardContent>
        </Card>
        <Card className="border-border bg-card">
          <CardContent className="p-4 flex items-center gap-4">
            <div className="h-10 w-10 rounded-lg bg-muted flex items-center justify-center">
              <MessageSquare className="h-5 w-5 text-muted-foreground" />
            </div>
            <div>
              <p className="text-2xl font-bold text-foreground">{reviews.length}</p>
              <p className="text-xs text-muted-foreground">Total Reviews</p>
            </div>
          </CardContent>
        </Card>
        <Card className="border-border bg-card">
          <CardContent className="p-4 flex items-center gap-4">
            <div className="h-10 w-10 rounded-lg bg-green-500/20 flex items-center justify-center">
              <ThumbsUp className="h-5 w-5 text-green-400" />
            </div>
            <div>
              <p className="text-2xl font-bold text-foreground">{reviews.filter(r => r.rating >= 4).length}</p>
              <p className="text-xs text-muted-foreground">Positive Reviews</p>
            </div>
          </CardContent>
        </Card>
        <Card className="border-border bg-card">
          <CardContent className="p-4 flex items-center gap-4">
            <div className="h-10 w-10 rounded-lg bg-accent/20 flex items-center justify-center">
              <TrendingUp className="h-5 w-5 text-accent" />
            </div>
            <div>
              <p className="text-2xl font-bold text-foreground">{reviews.length > 0 ? Math.round((reviews.filter(r => r.rating >= 4).length / reviews.length) * 100) : 0}%</p>
              <p className="text-xs text-muted-foreground">Satisfaction Rate</p>
            </div>
          </CardContent>
        </Card>
      </div>

      <Tabs defaultValue="reviews" className="w-full">
        <TabsList className="bg-muted border border-border">
          <TabsTrigger value="reviews">Customer Reviews</TabsTrigger>
          <TabsTrigger value="drivers">Driver Performance</TabsTrigger>
          <TabsTrigger value="analytics">Rating Analytics</TabsTrigger>
        </TabsList>

        <TabsContent value="reviews" className="mt-4">
          <div className="grid gap-4">
            {reviews.length === 0 && (
              <Card className="border-border bg-card">
                <CardContent className="p-12 text-center">
                  <div className="h-16 w-16 rounded-full bg-muted flex items-center justify-center mx-auto mb-4">
                    <MessageSquare className="h-8 w-8 text-muted-foreground" />
                  </div>
                  <h3 className="text-lg font-medium text-foreground mb-2">No Reviews Yet</h3>
                  <p className="text-muted-foreground mb-4">Start collecting customer feedback by adding your first review.</p>
                  <Button 
                    className="bg-primary text-primary-foreground hover:bg-primary/90"
                    onClick={() => {
                      setEditingReview(null)
                      setFormData({ customer_name: '', rating: 5, comment: '', driver_id: '', parcel_id: '' })
                      setIsDialogOpen(true)
                    }}
                  >
                    <Plus className="h-4 w-4 mr-2" />
                    Add First Review
                  </Button>
                </CardContent>
              </Card>
            )}
            {reviews.map((review) => (
              <Card key={review.id} className="border-border bg-card">
                <CardContent className="p-6">
                  <div className="flex items-start justify-between">
                    <div className="flex items-start gap-4">
                      <div className="h-10 w-10 rounded-full bg-muted flex items-center justify-center">
                        <User className="h-5 w-5 text-muted-foreground" />
                      </div>
                      <div>
                        <div className="flex items-center gap-2">
                          <p className="font-medium text-foreground">{review.customer_name}</p>
                          <span className="text-muted-foreground">•</span>
                          <span className="text-sm text-muted-foreground">{formatDate(review.created_at)}</span>
                        </div>
                        <div className="flex items-center gap-2 mt-1">
                          <StarRating rating={review.rating} />
                          <Badge variant="outline" className="border-border text-muted-foreground text-xs">
                            {review.parcel_tracking_id || 'N/A'}
                          </Badge>
                        </div>
                        <p className="text-foreground mt-3">{review.comment}</p>
                        <div className="flex items-center gap-4 mt-4">
                          <div className="flex items-center gap-2 text-sm text-muted-foreground">
                            <Truck className="h-4 w-4" />
                            <span>Driver: {review.driver_name || 'N/A'}</span>
                          </div>
                          <button 
                            onClick={() => handleMarkHelpful(review.id)}
                            className="flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors"
                          >
                            <ThumbsUp className="h-4 w-4" />
                            <span>{review.helpful_count} found helpful</span>
                          </button>
                        </div>
                      </div>
                    </div>
                    <div className="flex gap-2">
                      <Button 
                        variant="ghost" 
                        size="icon"
                        onClick={() => handleEdit(review)}
                        className="text-muted-foreground hover:text-foreground"
                      >
                        <Pencil className="h-4 w-4" />
                      </Button>
                      <Button 
                        variant="ghost" 
                        size="icon"
                        onClick={() => openDeleteDialog(review.id)}
                        className="text-muted-foreground hover:text-red-500"
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>

        <TabsContent value="drivers" className="mt-4">
          <Card className="border-border bg-card">
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle className="text-foreground text-base">Driver Performance Ratings</CardTitle>
              <div className="text-sm text-muted-foreground">
                {drivers.length} drivers • {reviews.length} total reviews
              </div>
            </CardHeader>
            <CardContent>
              <div className="space-y-6">
                {driverRatings.map((driver, idx) => (
                  <div key={idx} className="flex items-center gap-6 p-4 bg-muted/30 rounded-lg">
                    <div className="flex items-center gap-3 w-48">
                      <div className="h-10 w-10 rounded-full bg-muted flex items-center justify-center">
                        <User className="h-5 w-5 text-muted-foreground" />
                      </div>
                      <div>
                        <p className="font-medium text-foreground">{driver.name}</p>
                        <p className="text-xs text-muted-foreground">{driver.trips} trips</p>
                      </div>
                    </div>
                    <div className="flex-1">
                      <div className="flex items-center justify-between mb-2">
                        <StarRating rating={Math.round(driver.rating)} />
                        <span className="text-sm font-medium text-foreground">{driver.rating}</span>
                      </div>
                      <div className="h-2 bg-muted rounded-full overflow-hidden">
                        <div 
                          className="h-full bg-accent rounded-full"
                          style={{ width: `${(driver.rating / 5) * 100}%` }}
                        />
                      </div>
                    </div>
                    <div className="text-right w-24">
                      <p className="text-sm text-muted-foreground">{driver.reviews} reviews</p>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="analytics" className="mt-4">
          <div className="grid gap-4 md:grid-cols-2">
            <Card className="border-border bg-card">
              <CardHeader>
                <CardTitle className="text-foreground text-base">Rating Distribution</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {ratingDistribution.map((item) => (
                    <div key={item.stars} className="flex items-center gap-3">
                      <span className="text-sm text-muted-foreground w-8">{item.stars}★</span>
                      <div className="flex-1 h-2 bg-muted rounded-full overflow-hidden">
                        <div 
                          className="h-full bg-zinc-400 rounded-full"
                          style={{ width: `${item.percentage}%` }}
                        />
                      </div>
                      <span className="text-sm text-muted-foreground w-12 text-right">{item.count}</span>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
            <Card className="border-border bg-card">
              <CardHeader>
                <CardTitle className="text-foreground text-base">Review Insights</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="p-4 bg-card rounded-xl border border-border">
                    <div className="flex items-center gap-2 mb-2">
                      <TrendingUp className="h-4 w-4 text-green-400" />
                      <span className="font-medium text-foreground">Top Positive</span>
                    </div>
                    <p className="text-sm text-muted-foreground">"Professional drivers" mentioned in 45% of 5-star reviews</p>
                  </div>
                  <div className="p-4 bg-card rounded-xl border border-border">
                    <div className="flex items-center gap-2 mb-2">
                      <MessageSquare className="h-4 w-4 text-yellow-400" />
                      <span className="font-medium text-foreground">Common Feedback</span>
                    </div>
                    <p className="text-sm text-muted-foreground">"On-time delivery" is the most appreciated aspect</p>
                  </div>
                  <div className="p-4 bg-card rounded-xl border border-border">
                    <div className="flex items-center gap-2 mb-2">
                      <Star className="h-4 w-4 text-blue-400" />
                      <span className="font-medium text-foreground">Rating Trend</span>
                    </div>
                    <p className="text-sm text-muted-foreground">Average rating improved by 0.3 points this month</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>

      {/* Delete Confirmation Dialog */}
      <Dialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
        <DialogContent className="bg-muted border-border text-foreground max-w-sm">
          <DialogHeader>
            <DialogTitle>Delete Review</DialogTitle>
          </DialogHeader>
          <div className="py-4">
            <p className="text-muted-foreground">Are you sure you want to delete this review? This action cannot be undone.</p>
          </div>
          <div className="flex gap-2 justify-end">
            <Button 
              variant="outline" 
              onClick={() => setIsDeleteDialogOpen(false)}
              className="border-border text-foreground"
            >
              Cancel
            </Button>
            <Button 
              onClick={handleDelete}
              className="bg-red-500 text-white hover:bg-red-600"
            >
              Delete
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  )
}
