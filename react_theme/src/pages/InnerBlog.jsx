import React from 'react'
import Navbar from '../components/Navbar'
import Footer from '../components/Footer'
import { Link } from 'react-router-dom'

const InnerBlog = () => {
  // Static data for the blog post
  const blogData = {
    title: "Understanding Vedic Astrology: A Complete Guide to Ancient Wisdom",
    featuredImage: "https://astrosrinath.com/uploads/blog/1737354891-blog_image.png",
    author: {
      name: "Dr. Rajesh Sharma",
      avatar: "https://images.pexels.com/photos/2379004/pexels-photo-2379004.jpeg?auto=compress&cs=tinysrgb&w=400",
      bio: "Dr. Rajesh Sharma is a renowned Vedic astrologer with over 15 years of experience in traditional Indian astrology. He specializes in horoscope analysis, gemstone recommendations, and spiritual guidance."
    },
    publishDate: "December 15, 2024",
    content: `
      <p>Vedic astrology, also known as Jyotish, is an ancient Indian system of astrology that has been practiced for thousands of years. Unlike Western astrology, which is based on the tropical zodiac, Vedic astrology uses the sidereal zodiac, making it more accurate in its predictions.</p>
      
      <h2 class="blog-page-section-title">The Foundation of Vedic Astrology</h2>
      
      <p>Vedic astrology is based on the belief that the positions of planets at the time of birth influence a person's life, personality, and future. The system uses 12 houses, 9 planets, and 27 nakshatras (lunar mansions) to create a comprehensive birth chart.</p>
      
      <div class="blog-page-highlight-box">
        <h3>Key Components of Vedic Astrology:</h3>
        <ul>
          <li>Rashi (Zodiac Signs) - 12 signs based on sidereal zodiac</li>
          <li>Grahas (Planets) - 9 celestial bodies including Sun, Moon, Mars, etc.</li>
          <li>Bhavas (Houses) - 12 houses representing different life areas</li>
          <li>Nakshatras - 27 lunar mansions for detailed analysis</li>
        </ul>
      </div>
      
      <h2 class="blog-page-section-title">Understanding Your Birth Chart</h2>
      
      <p>Your birth chart, or Kundli, is a map of the sky at the exact moment of your birth. It shows the positions of all planets in different signs and houses, providing insights into your personality, strengths, weaknesses, and life path.</p>
      
      <p>Each house in your chart represents different aspects of life:</p>
      
      <div class="blog-page-highlight-box">
        <h3>House Meanings:</h3>
        <ul>
          <li>1st House: Self, personality, physical appearance</li>
          <li>2nd House: Wealth, family, speech</li>
          <li>3rd House: Siblings, courage, communication</li>
          <li>4th House: Mother, home, education</li>
          <li>5th House: Children, creativity, romance</li>
          <li>6th House: Health, enemies, service</li>
          <li>7th House: Marriage, partnerships, spouse</li>
          <li>8th House: Transformation, occult, longevity</li>
          <li>9th House: Father, higher learning, spirituality</li>
          <li>10th House: Career, reputation, authority</li>
          <li>11th House: Friends, gains, aspirations</li>
          <li>12th House: Losses, foreign lands, spirituality</li>
        </ul>
      </div>
      
      <h2 class="blog-page-section-title">The Power of Nakshatras</h2>
      
      <p>Nakshatras are one of the most important aspects of Vedic astrology. These 27 lunar mansions provide detailed insights into personality traits, compatibility, and life events. Each nakshatra has its own ruling deity, symbol, and characteristics.</p>
      
      <p>Understanding your nakshatra can help you make better life decisions, choose compatible partners, and understand your spiritual path.</p>
      
      <h2 class="blog-page-section-title">Modern Applications of Vedic Astrology</h2>
      
      <p>Today, Vedic astrology is used for various purposes including career guidance, relationship compatibility, health predictions, and spiritual growth. Many people consult Vedic astrologers for important life decisions such as marriage, career changes, or starting new ventures.</p>
      
      <p>The accuracy of Vedic astrology lies in its detailed calculations and the use of dashas (planetary periods) for timing events. This makes it particularly useful for predicting when certain events are likely to occur in your life.</p>
      
      <h2 class="blog-page-section-title">Conclusion</h2>
      
      <p>Vedic astrology offers a profound understanding of human nature and life's patterns. By studying your birth chart and understanding the cosmic influences on your life, you can make more informed decisions and live in harmony with the universe's natural rhythms.</p>
      
      <p>Whether you're seeking guidance for personal growth, relationship compatibility, or career decisions, Vedic astrology provides timeless wisdom that can help you navigate life's challenges with greater clarity and purpose.</p>
    `
  }

  // Static data for latest posts
  const latestPosts = [
    {
      id: 1,
      title: "The Science Behind Gemstone Therapy",
      thumbnail: "https://images.pexels.com/photos/2379004/pexels-photo-2379004.jpeg?auto=compress&cs=tinysrgb&w=400",
      date: "December 10, 2024"
    },
    {
      id: 2,
      title: "Understanding Your Moon Sign in Vedic Astrology",
      thumbnail: "https://images.pexels.com/photos/998267/pexels-photo-998267.jpeg?auto=compress&cs=tinysrgb&w=400",
      date: "December 5, 2024"
    },
    {
      id: 3,
      title: "How to Choose the Right Gemstone for You",
      thumbnail: "https://images.pexels.com/photos/998267/pexels-photo-998267.jpeg?auto=compress&cs=tinysrgb&w=400",
      date: "November 28, 2024"
    }
  ]

  return (
    <>
      <Navbar />
      
      {/* Breadcrumb Hero Section */}
      <section className="react-new-bread-hero-container">
        <div className="react-new-bread-hero-bg-pattern"></div>
        <div className="react-new-bread-hero-stars" id="new-bread-stars-container"></div>
        <div className="react-new-bread-hero-content">
          <div className="react-new-bread-astrology-icon">
            <i className="fas fa-star-and-crescent"></i>
          </div>
          <h1 className="react-new-bread-hero-title">Blog Details</h1>
          <div className="react-new-bread-breadcrumbs">
            <a href="#">Home</a>
            <span className="react-new-bread-breadcrumb-separator">/</span>
            <a href="#">Blog</a>
            <span className="react-new-bread-breadcrumb-separator">/</span>
            <span>Blog Details</span>
          </div>
        </div>
      </section>

      {/* Blog Page Content */}
      <div className="react-blog-page-container">
        <div className="react-blog-page-main-content">
          {/* Blog Post */}
          <article className="react-blog-page-post">
            <div className="react-blog-page-featured-image">
              <img src={blogData.featuredImage} alt={blogData.title} />
            </div>
            
            <div className="react-blog-page-post-header">
              <h1 className="react-blog-page-post-title">{blogData.title}</h1>
              
              <div className="react-blog-page-post-meta">
                <Link to="/astrologer">
                  <div className="react-blog-page-author-avatar">
                    <img src={blogData.author.avatar} alt={blogData.author.name} />
                  </div>
                </Link>
                <div className="react-blog-page-author-info">
                  <Link to="/astrologer">{blogData.author.name}</Link>
                  <span>{blogData.publishDate}</span>
                </div>
              </div>
            </div>
            
            <div 
              className="react-blog-page-post-content"
              dangerouslySetInnerHTML={{ __html: blogData.content }}
            />
          </article>

          {/* Sidebar */}
          <aside className="react-blog-page-sidebar">
            {/* Author Card */}
            <div className="react-blog-page-sidebar-card react-blog-page-author-card">
              <h2 className="react-blog-page-sidebar-title">Author</h2>
              <Link to="/astrologer">
                <div className="react-blog-page-author-avatar2">
                  <img src={blogData.author.avatar} alt={blogData.author.name} />
                </div>
              </Link>
              <Link to="/astrologer">{blogData.author.name}</Link>
              <p>{blogData.author.bio}</p>
            </div>

            {/* Latest Posts */}
            <div className="react-blog-page-sidebar-card">
              <h2 className="react-blog-page-sidebar-title">Latest Posts</h2>
              <div className="react-blog-page-latest-posts">
                {latestPosts.map((post) => (
                  <Link key={post.id} to="/blog">
                    <div className="react-blog-page-post-item">
                      <div className="react-blog-page-post-thumbnail">
                        <img src={post.thumbnail} alt={post.title} />
                      </div>
                      <div className="react-blog-page-post-info">
                        <h4>{post.title}</h4>
                        <span>{post.date}</span>
                      </div>
                    </div>
                  </Link>
                ))}
              </div>
            </div>
          </aside>
        </div>
      </div>

      <Footer />
    </>
  )
}

export default InnerBlog