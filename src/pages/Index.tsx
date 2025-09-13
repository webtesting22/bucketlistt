import { Header } from "@/components/Header";
import { Hero } from "@/components/Hero";
import { DestinationCard } from "@/components/DestinationCard";
import { ExperienceCard } from "@/components/ExperienceCard";
import { TestimonialCarousel } from "@/components/TestimonialCarousel";
import AppDownloadBanner from "@/components/AppDownloadBanner";
import { SEO } from "@/components/SEO";

import { LoadingGrid } from "@/components/LoadingSpinner";
import { Button } from "@/components/ui/button";
import { SimpleHorizontalScroll } from "@/components/ui/SimpleHorizontalScroll";

import { BidirectionalAnimatedSection } from "@/components/BidirectionalAnimatedSection";
import { ArrowRight, Star, Gift } from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useNavigate } from "react-router-dom";
import { useEffect } from "react";
import RotatingText from "@/components/ui/RotatingText";

const Index = () => {
  const navigate = useNavigate();

  // Scroll to top when component mounts
  useEffect(() => {
    window.scrollTo(0, 0);
  }, []);

  const { data: destinations, isLoading: destinationsLoading } = useQuery({
    queryKey: ["destinations"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("destinations")
        .select("*")
        .order("created_at", { ascending: true });

      if (error) throw error;
      return data;
    },
  });

  const { data: experiences, isLoading: experiencesLoading } = useQuery({
    queryKey: ["experiences"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("experiences")
        .select(
          `
          *,
          experience_images!inner (
            image_url,
            is_primary
          )
        `
        )
        .order("created_at", { ascending: true })
        .limit(8);

      if (error) throw error;
      return data;
    },
  });

  const getExperienceImage = (experience: any) => {
    // Use main image_url if available, otherwise use primary image from experience_images
    if (experience.image_url) {
      return experience.image_url;
    }

    // Find primary image from experience_images
    const primaryImage = experience.experience_images?.find(
      (img: any) => img.is_primary
    );
    return primaryImage?.image_url || "/placeholder.svg";
  };

  // Generate structured data for homepage
  const homepageStructuredData = {
    "@context": "https://schema.org",
    "@graph": [
      {
        "@type": "WebSite",
        "@id": "https://www.bucketlistt.com/#website",
        "url": "https://www.bucketlistt.com/",
        "name": "BucketListt",
        "description": "India's premier adventure tourism platform offering curated experiences",
        "potentialAction": [
          {
            "@type": "SearchAction",
            "target": {
              "@type": "EntryPoint",
              "urlTemplate": "https://www.bucketlistt.com/search?q={search_term_string}"
            },
            "query-input": "required name=search_term_string"
          }
        ]
      },
      {
        "@type": "TravelAgency",
        "@id": "https://www.bucketlistt.com/#organization",
        "name": "BucketListt",
        "url": "https://www.bucketlistt.com/",
        "logo": {
          "@type": "ImageObject",
          "url": "https://www.bucketlistt.com/bucket-list-icon.png"
        },
        "description": "ATOAI certified adventure tourism company offering premium travel experiences across India",
        "address": {
          "@type": "PostalAddress",
          "addressCountry": "IN"
        },
        "sameAs": [
          "https://www.atoai.org/"
        ]
      }
    ]
  };

  return (
    <div className="min-h-screen bg-background">
      <SEO 
        title="BucketListt - Discover Adventures & Plan Your Dream Trips"
        description="Discover India's best adventure experiences with BucketListt. Book bungee jumping, rafting, trekking & more. ATOAI certified tours with lowest prices guaranteed."
        keywords="adventure tours, travel experiences, India tourism, bungee jumping, rafting, trekking, ATOAI certified, bucket list adventures, adventure activities India"
        structuredData={homepageStructuredData}
      />
      <Header />

      <BidirectionalAnimatedSection
        animation="fade-up"
        delay={100}
        duration={800}
      >
        <Hero />
      </BidirectionalAnimatedSection>

      {/* Features Section */}
      <BidirectionalAnimatedSection
        animation="fade-up"
        delay={200}
        duration={700}
      >
        <section className="section-wrapper section-bg-secondary">
          <div className="container">
            <div className="grid grid-cols-2 sm:grid-cols-2 lg:grid-cols-4 gap-4 md:gap-8 max-w-6xl mx-auto">
              {[
                {
                  icon: "💎",
                  title: "Only the finest",
                  description:
                    "At bucketlistt, you only find the best. We do the hard work so you don't have to.",
                },
                {
                  icon: "💚",
                  title: "Greed is good",
                  description:
                    "With quality you also get lowest prices, last-minute availability and 24*7 support.",
                },
                {
                  icon: "💖",
                  title: "Experience joy & safety",
                  description:
                    "Following ATOAI guidelines, we ensure all adventures - offbeat or mainstream",
                },
                {
                  icon: "😎",
                  title: "No pain, only gain",
                  description:
                    "Don't think for it! We'll give you your money back, fast! Okay, just confident.",
                },
              ].map((feature, index) => (
                <BidirectionalAnimatedSection
                  key={index}
                  animation="fade-up"
                  delay={300 + index * 100}
                  duration={600}
                >
                  <div className="text-center group p-4 md:p-0">
                    <div className="text-3xl md:text-4xl mb-3 md:mb-4 group-hover:scale-110 transition-transform duration-300">
                      {feature.icon}
                    </div>
                    <h3 className="text-base md:text-lg font-semibold mb-2 md:mb-3 text-foreground">
                      {feature.title}
                    </h3>
                    <p className="text-sm text-muted-foreground leading-relaxed">
                      {feature.description}
                    </p>
                  </div>
                </BidirectionalAnimatedSection>
              ))}
            </div>
          </div>
        </section>
      </BidirectionalAnimatedSection>

      {/* Popular Destinations */}
      <BidirectionalAnimatedSection
        animation="fade-up"
        delay={200}
        duration={700}
      >
        <section className="section-wrapper section-bg-primary">
          <div className="container">
            <BidirectionalAnimatedSection
              animation="fade-up"
              delay={100}
              duration={600}
            >
              <div className="flex items-center gap-3 mb-6 md:mb-8">
                <h2 className="text-2xl md:text-3xl font-bold">
                  Our popular destinations
                </h2>
              </div>
            </BidirectionalAnimatedSection>

            {destinationsLoading ? (
              <SimpleHorizontalScroll showNavigation={false} disableScrollAnimations={true}>
                {Array.from({ length: 6 }).map((_, index) => (
                  <div
                    key={index}
                    className="w-40 md:w-48 h-32 md:h-40 bg-gray-200 dark:bg-gray-700 rounded-lg animate-pulse"
                  />
                ))}
              </SimpleHorizontalScroll>
            ) : (
              <>
                <SimpleHorizontalScroll
                  itemClassName="w-40 md:w-48"
                  className="mt-4"
                  disableScrollAnimations={true}
                >
                  {destinations?.slice(0, 8).map((destination, index) => (
                    <div key={destination.id} className="card-hover">
                      <DestinationCard
                        id={destination.id}
                        image={destination.image_url || ""}
                        title={destination.title}
                        subtitle={destination.subtitle || ""}
                      />
                    </div>
                  ))}
                </SimpleHorizontalScroll>

                <BidirectionalAnimatedSection
                  animation="fade-up"
                  delay={400}
                  duration={600}
                >
                  <div className="text-center mt-8 md:mt-12">
                    <Button
                      variant="outline"
                      size="lg"
                      className="hover:bg-orange-50 hover:border-orange-200 dark:hover:bg-orange-950 button-smooth w-full sm:w-auto"
                      onClick={() => navigate("/destinations")}
                    >
                      View all destinations
                      <ArrowRight className="ml-2 h-4 w-4" />
                    </Button>
                  </div>
                </BidirectionalAnimatedSection>
              </>
            )}
          </div>
        </section>
      </BidirectionalAnimatedSection>

      {/* Offers Section */}
      <BidirectionalAnimatedSection
        animation="fade-up"
        delay={200}
        duration={700}
      >
        <section className="section-wrapper section-bg-secondary">
          <div className="container">
            <BidirectionalAnimatedSection
              animation="fade-up"
              delay={100}
              duration={600}
            >
              <div className="flex items-center gap-3 mb-6 md:mb-8">
                <h2 className="text-2xl md:text-3xl font-bold">
                  Offers for you
                </h2>
              </div>
            </BidirectionalAnimatedSection>

            {experiencesLoading ? (
              <SimpleHorizontalScroll showNavigation={false} disableScrollAnimations={true}>
                {Array.from({ length: 4 }).map((_, index) => (
                  <div
                    key={index}
                    className="w-64 md:w-72 h-80 bg-gray-200 dark:bg-gray-700 rounded-lg animate-pulse"
                  />
                ))}
              </SimpleHorizontalScroll>
            ) : (
              <SimpleHorizontalScroll
                itemClassName="w-64 md:w-72"
                className="mt-4"
                disableScrollAnimations={true}
              >
                {experiences?.map((experience, index) => (
                  <div key={experience.id} className="card-hover">
                    <ExperienceCard
                      id={experience.id}
                      image={getExperienceImage(experience)}
                      title={experience.title}
                      category={experience.category}
                      rating={Number(experience.rating)}
                      reviews={experience.reviews_count?.toString() || "0"}
                      price={`From ${
                        experience.currency === "USD"
                          ? "₹"
                          : experience.currency
                      } ${experience.price}`}
                      originalPrice={
                        experience.original_price
                          ? `${
                              experience.currency === "USD"
                                ? "₹"
                                : experience.currency
                            } ${experience.original_price}`
                          : undefined
                      }
                      duration={experience.duration || undefined}
                      groupSize={experience.group_size || undefined}
                      isSpecialOffer={experience.is_special_offer || false}
                    />
                  </div>
                ))}
              </SimpleHorizontalScroll>
            )}

            <BidirectionalAnimatedSection
              animation="fade-up"
              delay={400}
              duration={600}
            >
              <div className="text-center mt-8 md:mt-12">
                <Button
                  variant="outline"
                  size="lg"
                  className="hover:bg-orange-50 hover:border-orange-200 dark:hover:bg-orange-950 button-smooth w-full sm:w-auto"
                  onClick={() => navigate("/experiences")}
                >
                  View all experiences
                  <ArrowRight className="ml-2 h-4 w-4" />
                </Button>
              </div>
            </BidirectionalAnimatedSection>
          </div>
        </section>
      </BidirectionalAnimatedSection>

      {/* Testimonials Section */}
      <BidirectionalAnimatedSection
        animation="fade-up"
        delay={200}
        duration={700}
      >
        <TestimonialCarousel />
      </BidirectionalAnimatedSection>

      {/* App Download Banner */}
      <AppDownloadBanner />

      {/* Why Choose Us */}
      <BidirectionalAnimatedSection
        animation="fade-up"
        delay={200}
        duration={700}
      >
        <section className="section-wrapper section-bg-primary">
          <div className="container">
            <BidirectionalAnimatedSection
              animation="fade-up"
              delay={100}
              duration={600}
            >
              <h2 className="text-2xl md:text-3xl font-bold text-center mb-8 md:mb-12">
                Why choose bucketlistt ?
              </h2>
            </BidirectionalAnimatedSection>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 md:gap-8">
              {[
                {
                  icon: Star,
                  gradient: "from-orange-400 to-red-500",
                  title: "Discover the possibilities",
                  description:
                    "your next adventure starts here with unforgettable experiences like bungee jumping, rafting, and more.",
                },
                {
                  icon: Gift,
                  gradient: "from-blue-400 to-purple-500",
                  title: "Enjoy deals & delights",
                  description:
                    "Quality activities. Great prices. Plus, earn credits to save more.",
                },
                {
                  icon: ArrowRight,
                  gradient: "from-green-400 to-teal-500",
                  title: "Exploring made easy",
                  description:
                    "Book last minute, skip lines & get free cancellation for easier exploring.",
                },
                {
                  icon: Star,
                  gradient: "from-pink-400 to-rose-500",
                  title: "Travel you can trust",
                  description:
                    "Read reviews & get reliable customer support. We're with you at every step.",
                },
              ].map((feature, index) => {
                const IconComponent = feature.icon;
                return (
                  <BidirectionalAnimatedSection
                    key={index}
                    animation="fade-up"
                    delay={300 + index * 100}
                    duration={600}
                  >
                    <div className="text-center group p-4 md:p-0">
                      <div
                        className={`w-12 h-12 md:w-16 md:h-16 mx-auto mb-3 md:mb-4 bg-gradient-to-br ${feature.gradient} rounded-2xl flex items-center justify-center group-hover:scale-110 transition-transform duration-300`}
                      >
                        <IconComponent className="h-6 w-6 md:h-8 md:w-8 text-white" />
                      </div>
                      <h3 className="text-lg md:text-xl font-semibold mb-2">
                        {feature.title}
                      </h3>
                      <p className="text-sm md:text-base text-muted-foreground">
                        {feature.description}
                      </p>
                    </div>
                  </BidirectionalAnimatedSection>
                );
              })}
            </div>

            <div className="mt-12 md:mt-16 space-y-8 md:space-y-12">
              <BidirectionalAnimatedSection
                animation="fade-up"
                delay={100}
                duration={600}
              >
                <h4 className="text-xl md:text-2xl font-bold text-center mb-4 md:mb-5">
                  And we are ATOAI certified
                </h4>
                <img
                  src="/ATOAI_logo.jpg"
                  alt="ATOAI Logo"
                  className="mx-auto w-32 md:w-48 h-auto rounded-lg"
                />
              </BidirectionalAnimatedSection>

              <BidirectionalAnimatedSection
                animation="fade-up"
                delay={100}
                duration={600}
              >
                <h4 className="text-base md:text-xl text-center mb-8 md:mb-12 px-4">
                  <span className="font-bold">bucketlistt</span> strictly
                  adheres to the safety, ethical, and operational standards set
                  by the{" "}
                  <a
                    href="https://www.atoai.org/"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="font-bold hover:text-orange-500"
                  >
                    Adventure Tour Operators Association of India (ATOAI)
                  </a>
                  . All activities offered on our platform comply with the Basic
                  Minimum Standards prescribed for adventure tourism, ensuring
                  responsible practices, trained staff, certified equipment, and
                  a strong commitment to environmental sustainability. Your
                  safety and experience are our top priorities.
                </h4>
              </BidirectionalAnimatedSection>

              <BidirectionalAnimatedSection
                animation="fade-up"
                delay={100}
                duration={600}
              >
                <h4 className="text-xl md:text-2xl font-bold text-center mb-4 md:mb-5">
                  And on top of that we're proudly built in
                </h4>
                <div className="flex justify-center mb-4">
                  <RotatingText
                    texts={["India", "भारत", "ભારત"]}
                    className="text-2xl md:text-4xl font-bold text-orange-500"
                    rotationInterval={2000}
                  />
                </div>
                <img
                  src="/indian_flag.gif"
                  alt="Indian Flag"
                  className="mx-auto w-32 md:w-48 h-auto rounded-lg"
                />
              </BidirectionalAnimatedSection>
            </div>
          </div>
        </section>
      </BidirectionalAnimatedSection>
    </div>
  );
};

export default Index;
