import { Header } from "@/components/Header";
import { BidirectionalAnimatedSection } from "@/components/BidirectionalAnimatedSection";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Heart, Mountain, Users, Zap } from "lucide-react";

const OurStory = () => {
  return (
    <div className="min-h-screen bg-background">
      <Header />
      
      {/* Hero Section */}
      <BidirectionalAnimatedSection animation="fade-up" delay={100} duration={600}>
        <section className="section-wrapper-lg section-bg-secondary bg-gradient-to-br from-orange-50 to-red-50 dark:from-orange-950/20 dark:to-red-950/20">
          <div className="container text-center">
            <Badge variant="outline" className="mb-4 text-orange-500 border-orange-500">
              Our Journey
            </Badge>
            <h1 className="text-4xl md:text-6xl font-bold mb-6 bg-gradient-to-r from-orange-500 to-red-500 bg-clip-text text-transparent">
              Our Story
            </h1>
            <p className="text-xl text-muted-foreground max-w-3xl mx-auto leading-relaxed">
              From three friends sharing chai in Ahmedabad to building India's most trusted adventure platform
            </p>
          </div>
        </section>
      </BidirectionalAnimatedSection>

        {/* Story Content */}
        <section className="section-wrapper section-bg-primary">
          <div className="container max-w-4xl mx-auto">
            
            {/* The Beginning */}
            <BidirectionalAnimatedSection animation="fade-up" delay={200} duration={600}>
              <Card className="mb-12 overflow-hidden">
                <CardContent className="p-8 md:p-12">
                  <div className="flex items-center mb-6">
                    <div className="w-12 h-12 bg-orange-100 dark:bg-orange-900/20 rounded-full flex items-center justify-center mr-4">
                      <Heart className="h-6 w-6 text-orange-500" />
                    </div>
                    <h2 className="text-2xl md:text-3xl font-bold">The Beginning</h2>
                  </div>
                  <p className="text-lg text-muted-foreground leading-relaxed mb-6">
                    In the heart of Ahmedabad, three friends sat together one monsoon evening—each with a cup of chai, 
                    a dream in their eyes, and a passion to create something meaningful. <strong>Shubham Makhecha</strong>, 
                    a brilliant mind who secured AIR 36 in the CA final exams, always knew life wasn't meant to be spent 
                    just behind a desk.
                  </p>
                  <p className="text-lg text-muted-foreground leading-relaxed">
                    Alongside him were his two closest companions—<strong>CA Nitant Desai</strong>, known for his strategic 
                    thinking and calm demeanor, and <strong>Darshit Joshi</strong>, a coding wizard with a knack for building 
                    powerful digital products.
                  </p>
                </CardContent>
              </Card>
            </BidirectionalAnimatedSection>

            {/* The Spark */}
            <BidirectionalAnimatedSection animation="fade-up" delay={300} duration={600}>
              <Card className="mb-12 overflow-hidden">
                <CardContent className="p-8 md:p-12">
                  <div className="flex items-center mb-6">
                    <div className="w-12 h-12 bg-blue-100 dark:bg-blue-900/20 rounded-full flex items-center justify-center mr-4">
                      <Zap className="h-6 w-6 text-blue-500" />
                    </div>
                    <h2 className="text-2xl md:text-3xl font-bold">The Spark</h2>
                  </div>
                  <p className="text-lg text-muted-foreground leading-relaxed mb-6">
                    Their idea was born out of a simple realization: while careers were important, life was about experiences. 
                    The trio shared a love for adventure—trekking through misty mountains, jumping off cliffs into blue rivers, 
                    and discovering the untouched corners of India.
                  </p>
                  <p className="text-lg text-muted-foreground leading-relaxed mb-6">
                    But each time they tried to plan an activity, they faced the same hurdles—confusing platforms, 
                    lack of safety assurance, and poor coordination.
                  </p>
                  <div className="bg-orange-50 dark:bg-orange-950/20 p-6 rounded-lg border-l-4 border-orange-500">
                    <p className="text-lg font-medium text-orange-700 dark:text-orange-300">
                      "Why not create something ourselves?" said Shubham.
                    </p>
                  </div>
                </CardContent>
              </Card>
            </BidirectionalAnimatedSection>

            {/* The Birth of BucketListt */}
            <BidirectionalAnimatedSection animation="fade-up" delay={400} duration={600}>
              <Card className="mb-12 overflow-hidden">
                <CardContent className="p-8 md:p-12">
                  <div className="flex items-center mb-6">
                    <div className="w-12 h-12 bg-green-100 dark:bg-green-900/20 rounded-full flex items-center justify-center mr-4">
                      <Mountain className="h-6 w-6 text-green-500" />
                    </div>
                    <h2 className="text-2xl md:text-3xl font-bold">The Birth of BucketListt</h2>
                  </div>
                  <p className="text-lg text-muted-foreground leading-relaxed mb-6">
                    And thus, <strong className="text-orange-500">BucketListt</strong> was born—a platform where people 
                    could browse, book, and enjoy thrilling adventure activities like bungee jumping, paragliding, 
                    and river rafting, all with verified vendors and safety protocols.
                  </p>
                  
                  <div className="grid md:grid-cols-3 gap-6 mt-8">
                    <div className="text-center p-4 rounded-lg bg-muted/30">
                      <div className="w-16 h-16 bg-orange-100 dark:bg-orange-900/20 rounded-full flex items-center justify-center mx-auto mb-3">
                        <img src="/shubham_makhecha.png" alt="Shubham" className="w-12 h-12 rounded-full object-cover" />
                      </div>
                      <h3 className="font-semibold mb-2">Shubham Makhecha</h3>
                      <p className="text-sm text-muted-foreground">Operations & Partnerships</p>
                      <p className="text-xs text-muted-foreground mt-1">Ensuring certified & trusted adventures</p>
                    </div>
                    
                    <div className="text-center p-4 rounded-lg bg-muted/30">
                      <div className="w-16 h-16 bg-blue-100 dark:bg-blue-900/20 rounded-full flex items-center justify-center mx-auto mb-3">
                        <img src="/nitant_desai.jpg" alt="Nitant" className="w-12 h-12 rounded-full object-cover" />
                      </div>
                      <h3 className="font-semibold mb-2">Nitant Desai</h3>
                      <p className="text-sm text-muted-foreground">Finance & Legal</p>
                      <p className="text-xs text-muted-foreground mt-1">Building solid business backbone</p>
                    </div>
                    
                    <div className="text-center p-4 rounded-lg bg-muted/30">
                      <div className="w-16 h-16 bg-green-100 dark:bg-green-900/20 rounded-full flex items-center justify-center mx-auto mb-3">
                        <img src="/Darshit Joshi.png" alt="Darshit" className="w-12 h-12 rounded-full object-cover" />
                      </div>
                      <h3 className="font-semibold mb-2">Darshit Joshi</h3>
                      <p className="text-sm text-muted-foreground">Technology & Product</p>
                      <p className="text-xs text-muted-foreground mt-1">Designing sleek, user-friendly platform</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </BidirectionalAnimatedSection>

            {/* Our Mission */}
            <BidirectionalAnimatedSection animation="fade-up" delay={500} duration={600}>
              <Card className="mb-12 overflow-hidden">
                <CardContent className="p-8 md:p-12">
                  <div className="flex items-center mb-6">
                    <div className="w-12 h-12 bg-purple-100 dark:bg-purple-900/20 rounded-full flex items-center justify-center mr-4">
                      <Users className="h-6 w-6 text-purple-500" />
                    </div>
                    <h2 className="text-2xl md:text-3xl font-bold">Our Mission</h2>
                  </div>
                  
                  <div className="text-center mb-8">
                    <div className="inline-flex items-center space-x-4 bg-gradient-to-r from-orange-500 to-red-500 text-white px-8 py-4 rounded-full text-lg font-semibold">
                      <span>Safe.</span>
                      <span>•</span>
                      <span>Seamless.</span>
                      <span>•</span>
                      <span>Epic.</span>
                    </div>
                  </div>
                  
                  <p className="text-lg text-muted-foreground leading-relaxed mb-6">
                    Soon, BucketListt became the go-to place for explorers across India. From students ticking off 
                    their first solo adventure to families looking for a fun weekend escape, BucketListt changed 
                    the way people experienced life.
                  </p>
                  
                  <div className="bg-gradient-to-r from-orange-50 to-red-50 dark:from-orange-950/20 dark:to-red-950/20 p-8 rounded-xl">
                    <p className="text-lg text-center font-medium leading-relaxed">
                      And for Shubham, Nitant, and Darshit, it wasn't just a business. It was a 
                      <span className="text-orange-500 font-bold"> celebration of friendship, freedom, and the endless pursuit of adventure.</span>
                    </p>
                  </div>
                </CardContent>
              </Card>
            </BidirectionalAnimatedSection>

            {/* Call to Action */}
            <BidirectionalAnimatedSection animation="fade-up" delay={600} duration={600}>
              <div className="text-center py-12">
                <h2 className="text-3xl font-bold mb-4">Ready to Start Your Adventure?</h2>
                <p className="text-muted-foreground mb-8 max-w-2xl mx-auto">
                  Join thousands of adventurers who trust BucketListt for their next epic experience
                </p>
                <div className="flex flex-col sm:flex-row gap-4 justify-center">
                  <button 
                    className="px-8 py-3 bg-orange-500 hover:bg-orange-600 text-white rounded-lg font-semibold transition-colors duration-300"
                    onClick={() => window.location.href = '/experiences'}
                  >
                    Explore Adventures
                  </button>
                  <button 
                    className="px-8 py-3 border border-orange-500 text-orange-500 hover:bg-orange-500 hover:text-white rounded-lg font-semibold transition-colors duration-300"
                    onClick={() => window.location.href = '/contact'}
                  >
                    Get in Touch
                  </button>
                </div>
              </div>
            </BidirectionalAnimatedSection>
          </div>
        </section>
    </div>
  );
};

export default OurStory;