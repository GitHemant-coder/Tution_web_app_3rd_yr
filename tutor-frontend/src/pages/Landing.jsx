import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import {
  BookOpen, Video, BarChart3, User, Monitor, Users,
  Check, Star, Mail, Phone, MapPin, Facebook,
  Twitter, Instagram, Linkedin, GraduationCap, ArrowRight,
  Sparkles, Trophy, Clock, Shield, Zap, Heart
} from 'lucide-react';
import '../App.css';
import ChatBot from '../components/ChatBot';

export default function Landing() {
  const [quote, setQuote] = useState({ text: 'Loading inspiring thought...', author: '' });
  const [isVisible, setIsVisible] = useState({});

  useEffect(() => {
    const fallbackQuotes = [
      { text: "The future belongs to those who believe in the beauty of their dreams.", author: "Eleanor Roosevelt" },
      { text: "Success is the sum of small efforts, repeated day in and day out.", author: "Robert Collier" },
      { text: "Education is the most powerful weapon which you can use to change the world.", author: "Nelson Mandela" },
      { text: "The expert in anything was once a beginner.", author: "Helen Hayes" },
      { text: "There are no shortcuts to any place worth going.", author: "Beverly Sills" },
      { text: "Don't let what you cannot do interfere with what you can do.", author: "John Wooden" },
      { text: "Motivation is what gets you started. Habit is what keeps you going.", author: "Jim Ryun" },
      { text: "Strive for progress, not perfection.", author: "Unknown" },
      { text: "The roots of education are bitter, but the fruit is sweet.", author: "Aristotle" },
      { text: "A person who never made a mistake never tried anything new.", author: "Albert Einstein" }
    ];

    fetch('https://api.quotable.io/quotes/random?tags=education|success|learning')
      .then(res => {
        if (!res.ok) throw new Error("API error");
        return res.json();
      })
      .then(data => {
        if (data && data.length > 0) {
          setQuote({ text: data[0].content, author: data[0].author });
        } else {
          throw new Error("No quotes returned");
        }
      })
      .catch(err => {
        console.error("Error fetching student quote:", err);
        const randomFallback = fallbackQuotes[Math.floor(Math.random() * fallbackQuotes.length)];
        setQuote(randomFallback);
      });
  }, []);

  // Scroll animation hook
  useEffect(() => {
    const observerOptions = {
      threshold: 0.1,
      rootMargin: '0px 0px -50px 0px'
    };

    const observer = new IntersectionObserver((entries) => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          setIsVisible(prev => ({ ...prev, [entry.target.id]: true }));
        }
      });
    }, observerOptions);

    document.querySelectorAll('section, .animate-on-scroll').forEach(el => {
      observer.observe(el);
    });

    return () => observer.disconnect();
  }, []);

  return (
    <div style={{ background: '#0f172a', color: 'white' }} className="bg-pattern">
      {/* Hero Section */}
      <div style={{
        minHeight: 'calc(100vh - 80px)',
        background: 'linear-gradient(135deg, #6366f1 0%, #4338ca 50%, #312e81 100%)',
        color: 'white',
        overflow: 'hidden',
        position: 'relative'
      }}>
        {/* Animated Background Elements */}
        <div style={{
          position: 'absolute',
          top: '10%',
          left: '5%',
          width: '300px',
          height: '300px',
          background: 'radial-gradient(circle, rgba(79, 70, 229, 0.3) 0%, transparent 70%)',
          borderRadius: '50%',
          animation: 'pulse 4s ease-in-out infinite',
          filter: 'blur(40px)'
        }} />
        <div style={{
          position: 'absolute',
          bottom: '20%',
          right: '10%',
          width: '250px',
          height: '250px',
          background: 'radial-gradient(circle, rgba(16, 185, 129, 0.25) 0%, transparent 70%)',
          borderRadius: '50%',
          animation: 'pulse 4s ease-in-out infinite 2s',
          filter: 'blur(40px)'
        }} />

        <div style={{
          maxWidth: '1200px',
          margin: '0 auto',
          padding: '80px 24px',
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(400px, 1fr))',
          alignItems: 'center',
          gap: '40px',
          position: 'relative',
          zIndex: 1
        }}>
          {/* Left side content */}
          <div className="page-enter-active">
            {/* Badge */}
            <div className="slide-in-left" style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '8px',
              background: 'rgba(255,255,255,0.15)',
              backdropFilter: 'blur(10px)',
              padding: '8px 16px',
              borderRadius: '50px',
              marginBottom: '24px',
              border: '1px solid rgba(255,255,255,0.2)'
            }}>
              <Sparkles size={16} color="#fbbf24" />
              <span style={{ fontSize: '0.9rem', fontWeight: '600' }}>India's #1 Learning Platform</span>
            </div>

            <h1 style={{
              fontSize: '4.5rem',
              fontWeight: '900',
              lineHeight: '1.1',
              marginBottom: '24px',
              color: 'white'
            }}>
              Connect. Learn.<br />
              <span style={{
                color: '#fbbf24',
                background: 'linear-gradient(135deg, #fbbf24, #f59e0b)',
                WebkitBackgroundClip: 'text',
                WebkitTextFillColor: 'transparent',
                backgroundClip: 'text'
              }}>Excel.</span>
            </h1>

            <p style={{
              fontSize: '1.25rem',
              opacity: '0.9',
              lineHeight: '1.6',
              marginBottom: '40px',
              maxWidth: '540px'
            }}>
              The most trusted online tuition platform connecting students, teachers, and parents for personalized learning experiences.
            </p>

            <div style={{ display: 'flex', gap: '20px', marginBottom: '80px', flexWrap: 'wrap' }}>
              <Link to="/login" className="btn-modern btn-gradient" style={{
                color: 'white',
                textDecoration: 'none'
              }}>
                Get Started Today
                <ArrowRight size={20} />
              </Link>

              <a href="#how-it-works" className="btn-modern" style={{
                border: '2px solid rgba(255,255,255,0.4)',
                color: 'white',
                background: 'rgba(255,255,255,0.1)',
                backdropFilter: 'blur(10px)'
              }}>Learn More</a>
            </div>

            {/* Stats */}
            <div style={{ display: 'flex', gap: '60px', flexWrap: 'wrap' }}>
              <div className="scale-in delay-100">
                <div style={{ fontSize: '2.4rem', fontWeight: '900', display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <Trophy size={28} color="#fbbf24" /> 10K+
                </div>
                <div style={{ fontSize: '1rem', opacity: '0.7', fontWeight: '500' }}>Students</div>
              </div>
              <div className="scale-in delay-200">
                <div style={{ fontSize: '2.4rem', fontWeight: '900', display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <User size={28} color="#10b981" /> 5K+
                </div>
                <div style={{ fontSize: '1rem', opacity: '0.7', fontWeight: '500' }}>Teachers</div>
              </div>
              <div className="scale-in delay-300">
                <div style={{ fontSize: '2.4rem', fontWeight: '900', display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <Zap size={28} color="#f59e0b" /> 98%
                </div>
                <div style={{ fontSize: '1rem', opacity: '0.7', fontWeight: '500' }}>Success Rate</div>
              </div>
            </div>
          </div>

          {/* Right side floating elements */}
          <div style={{ position: 'relative', height: '500px' }} className="page-enter-active">
            <div className="floating-card" style={{
              position: 'absolute',
              top: '10%',
              left: '5%',
              background: 'white',
              color: '#1e293b',
              padding: '24px 32px',
              borderRadius: '20px',
              display: 'flex',
              alignItems: 'center',
              gap: '16px',
              boxShadow: '0 25px 50px -12px rgba(0,0,0,0.25)',
              animation: 'float 6s ease-in-out infinite'
            }}>
              <div style={{ color: '#4f46e5' }}><BookOpen size={28} /></div>
              <span style={{ fontWeight: '700', fontSize: '1.1rem' }}>Interactive Learning</span>
            </div>

            <div className="floating-card" style={{
              position: 'absolute',
              top: '40%',
              right: '0%',
              background: 'white',
              color: '#1e293b',
              padding: '24px 32px',
              borderRadius: '20px',
              display: 'flex',
              alignItems: 'center',
              gap: '16px',
              boxShadow: '0 25px 50px -12px rgba(0,0,0,0.25)',
              animation: 'float 6s ease-in-out infinite 1s'
            }}>
              <div style={{ color: '#4f46e5' }}><Video size={28} /></div>
              <span style={{ fontWeight: '700', fontSize: '1.1rem' }}>Live Sessions</span>
            </div>

            <div className="floating-card" style={{
              position: 'absolute',
              bottom: '15%',
              left: '15%',
              background: 'white',
              color: '#1e293b',
              padding: '24px 32px',
              borderRadius: '20px',
              display: 'flex',
              alignItems: 'center',
              gap: '16px',
              boxShadow: '0 25px 50px -12px rgba(0,0,0,0.25)',
              animation: 'float 6s ease-in-out infinite 2s'
            }}>
              <div style={{ color: '#4f46e5' }}><BarChart3 size={28} /></div>
              <span style={{ fontWeight: '700', fontSize: '1.1rem' }}>Progress Tracking</span>
            </div>
          </div>
        </div>
      </div>

      {/* Choose Your Role Section (How It Works) */}
      <section id="how-it-works" style={{
        padding: '100px 24px',
        background: '#1e293b',
        position: 'relative',
        overflow: 'hidden'
      }}>
        {/* Background decoration */}
        <div style={{
          position: 'absolute',
          top: '-50%',
          left: '-20%',
          width: '500px',
          height: '500px',
          background: 'radial-gradient(circle, rgba(79, 70, 229, 0.15) 0%, transparent 70%)',
          filter: 'blur(60px)'
        }} />
        <div style={{
          position: 'absolute',
          bottom: '-30%',
          right: '-10%',
          width: '400px',
          height: '400px',
          background: 'radial-gradient(circle, rgba(16, 185, 129, 0.1) 0%, transparent 70%)',
          filter: 'blur(60px)'
        }} />

        <div style={{ maxWidth: '1200px', margin: '0 auto', textAlign: 'center', position: 'relative', zIndex: 1 }}>
          <h2 className="gradient-text" style={{
            fontSize: '3rem',
            fontWeight: '800',
            marginBottom: '16px',
            color: 'white'
          }}>Choose Your Role</h2>
          <p style={{ color: '#94a3b8', fontSize: '1.1rem', maxWidth: '600px', margin: '0 auto 60px' }}>
            Join thousands of users who trust TutorConnect for their educational journey
          </p>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '30px' }}>
            {/* Student Card */}
            <div className="card-modern scale-in delay-100" style={{ textAlign: 'center', padding: '40px', background: 'white', color: '#1e293b' }}>
              <div style={{
                background: 'linear-gradient(135deg, #4f46e5, #7c3aed)',
                color: 'white',
                width: '70px',
                height: '70px',
                borderRadius: '20px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                margin: '0 auto 24px',
                boxShadow: '0 10px 20px rgba(79, 70, 229, 0.3)'
              }}>
                <User size={32} />
              </div>
              <h3 style={{ fontSize: '1.5rem', marginBottom: '16px', fontWeight: '700' }}>Student</h3>
              <p style={{ color: '#64748b', marginBottom: '24px', fontSize: '0.95rem' }}>
                Find qualified tutors, schedule sessions, track your progress, and excel in your studies.
              </p>
              <ul style={{ listStyle: 'none', padding: 0, textAlign: 'left', marginBottom: '32px' }}>
                {['Search & Filter Tutors', 'Interactive Learning Materials', 'Progress Tracking', 'Flexible Scheduling'].map((item, i) => (
                  <li key={item} style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '10px',
                    marginBottom: '12px',
                    fontSize: '0.9rem',
                    color: '#475569',
                    animation: `slideInLeft 0.5s ease forwards ${i * 0.1}s`,
                    opacity: 0
                  }}>
                    <div style={{
                      background: 'linear-gradient(135deg, #10b981, #059669)',
                      color: 'white',
                      width: '20px',
                      height: '20px',
                      borderRadius: '50%',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center'
                    }}>
                      <Check size={12} />
                    </div>
                    {item}
                  </li>
                ))}
              </ul>
              <Link to="/login" className="btn-modern btn-gradient" style={{ width: '100%', color: 'white', textDecoration: 'none' }}>
                Join as Student <ArrowRight size={18} />
              </Link>
            </div>

            {/* Teacher Card */}
            <div className="card-modern scale-in delay-200" style={{
              textAlign: 'center',
              padding: '40px',
              background: 'white',
              color: '#1e293b',
              position: 'relative',
              border: '2px solid #4f46e5'
            }}>
              <div style={{
                position: 'absolute',
                top: '-12px',
                left: '50%',
                transform: 'translateX(-50%)',
                background: 'linear-gradient(135deg, #f59e0b, #ef4444)',
                color: 'white',
                padding: '6px 20px',
                borderRadius: '20px',
                fontSize: '0.75rem',
                fontWeight: '700',
                boxShadow: '0 4px 12px rgba(245, 158, 11, 0.4)'
              }}>
                ✨ Most Popular
              </div>
              <div style={{
                background: 'linear-gradient(135deg, #4f46e5, #7c3aed)',
                color: 'white',
                width: '70px',
                height: '70px',
                borderRadius: '20px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                margin: '0 auto 24px',
                boxShadow: '0 10px 20px rgba(79, 70, 229, 0.3)'
              }}>
                <Monitor size={32} />
              </div>
              <h3 style={{ fontSize: '1.5rem', marginBottom: '16px', fontWeight: '700' }}>Teacher</h3>
              <p style={{ color: '#64748b', marginBottom: '24px', fontSize: '0.95rem' }}>
                Share your expertise, manage students, upload materials, and earn from teaching.
              </p>
              <ul style={{ listStyle: 'none', padding: 0, textAlign: 'left', marginBottom: '32px' }}>
                {['Student Management', 'Earnings Dashboard', 'Material Upload', 'Automated Receipts'].map((item, i) => (
                  <li key={item} style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '10px',
                    marginBottom: '12px',
                    fontSize: '0.9rem',
                    color: '#475569',
                    animation: `slideInLeft 0.5s ease forwards ${i * 0.1}s`,
                    opacity: 0
                  }}>
                    <div style={{
                      background: 'linear-gradient(135deg, #10b981, #059669)',
                      color: 'white',
                      width: '20px',
                      height: '20px',
                      borderRadius: '50%',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center'
                    }}>
                      <Check size={12} />
                    </div>
                    {item}
                  </li>
                ))}
              </ul>
              <Link to="/login" className="btn-modern btn-gradient" style={{ width: '100%', color: 'white', textDecoration: 'none' }}>
                Join as Teacher <ArrowRight size={18} />
              </Link>
            </div>

            {/* Parent Card */}
            <div className="card-modern scale-in delay-300" style={{ textAlign: 'center', padding: '40px', background: 'white', color: '#1e293b' }}>
              <div style={{
                background: 'linear-gradient(135deg, #4f46e5, #7c3aed)',
                color: 'white',
                width: '70px',
                height: '70px',
                borderRadius: '20px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                margin: '0 auto 24px',
                boxShadow: '0 10px 20px rgba(79, 70, 229, 0.3)'
              }}>
                <Users size={32} />
              </div>
              <h3 style={{ fontSize: '1.5rem', marginBottom: '16px', fontWeight: '700' }}>Parent</h3>
              <p style={{ color: '#64748b', marginBottom: '24px', fontSize: '0.95rem' }}>
                Monitor your children's progress, manage payments, and communicate with teachers.
              </p>
              <ul style={{ listStyle: 'none', padding: 0, textAlign: 'left', marginBottom: '32px' }}>
                {['Multi-Child Management', 'Payment Tracking', 'Progress Reports', 'Teacher Communication'].map((item, i) => (
                  <li key={item} style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '10px',
                    marginBottom: '12px',
                    fontSize: '0.9rem',
                    color: '#475569',
                    animation: `slideInLeft 0.5s ease forwards ${i * 0.1}s`,
                    opacity: 0
                  }}>
                    <div style={{
                      background: 'linear-gradient(135deg, #10b981, #059669)',
                      color: 'white',
                      width: '20px',
                      height: '20px',
                      borderRadius: '50%',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center'
                    }}>
                      <Check size={12} />
                    </div>
                    {item}
                  </li>
                ))}
              </ul>
              <Link to="/login" className="btn-modern btn-gradient" style={{ width: '100%', color: 'white', textDecoration: 'none' }}>
                Join as Parent <ArrowRight size={18} />
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* Notice Board Section */}
      <section id="notice-board" style={{
        padding: '100px 24px',
        background: '#0f172a',
        position: 'relative',
        overflow: 'hidden'
      }}>
        {/* Background decorations */}
        <div style={{
          position: 'absolute',
          top: '20%',
          left: '5%',
          width: '200px',
          height: '200px',
          background: 'radial-gradient(circle, rgba(251, 191, 36, 0.1) 0%, transparent 70%)',
          filter: 'blur(40px)'
        }} />

        <div style={{ maxWidth: '800px', margin: '0 auto', textAlign: 'center' }}>
          <h2 className="gradient-text" style={{
            fontSize: '3rem',
            fontWeight: '800',
            marginBottom: '16px',
            color: 'white'
          }}>Notice Board</h2>
          <p style={{ color: '#94a3b8', fontSize: '1.1rem', marginBottom: '60px' }}>Thought of the Day</p>

          <div className="glass-card-dark scale-in" style={{
            background: 'linear-gradient(135deg, rgba(30, 41, 59, 0.9), rgba(15, 23, 42, 0.9))',
            color: 'white',
            padding: '50px',
            borderRadius: '24px',
            border: '1px solid rgba(79, 70, 229, 0.3)',
            boxShadow: '0 20px 40px rgba(0,0,0,0.5)',
            position: 'relative',
            overflow: 'hidden'
          }}>
            {/* Decorative quote mark */}
            <div style={{
              fontSize: '8rem',
              color: '#4f46e5',
              lineHeight: '0.5',
              textAlign: 'left',
              opacity: '0.15',
              marginBottom: '20px',
              position: 'absolute',
              top: '-20px',
              left: '20px',
              fontWeight: '900'
            }}>"</div>

            <p style={{
              fontSize: '1.8rem',
              fontStyle: 'italic',
              marginBottom: '30px',
              color: '#e2e8f0',
              lineHeight: '1.4',
              position: 'relative',
              zIndex: 1
            }}>
              {quote.text}
            </p>
            <div style={{
              fontSize: '1.2rem',
              fontWeight: '700',
              background: 'linear-gradient(135deg, #fbbf24, #f59e0b)',
              WebkitBackgroundClip: 'text',
              WebkitTextFillColor: 'transparent',
              backgroundClip: 'text'
            }}>
              — {quote.author}
            </div>
          </div>
        </div>
      </section>

      {/* Footer / Contact Section */}
      <footer id="contact" style={{
        padding: '80px 24px 40px',
        background: 'linear-gradient(180deg, #1e293b 0%, #0f172a 100%)',
        borderTop: '1px solid rgba(255,255,255,0.05)',
        position: 'relative',
        overflow: 'hidden'
      }}>
        {/* Background decoration */}
        <div style={{
          position: 'absolute',
          bottom: '0',
          right: '0',
          width: '300px',
          height: '300px',
          background: 'radial-gradient(circle, rgba(79, 70, 229, 0.1) 0%, transparent 70%)',
          filter: 'blur(60px)'
        }} />

        <div style={{ maxWidth: '1200px', margin: '0 auto', position: 'relative', zIndex: 1 }}>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '60px', marginBottom: '80px' }}>
            <div>
              <div style={{
                display: 'flex',
                alignItems: 'center',
                gap: '10px',
                color: 'white',
                fontSize: '1.5rem',
                fontWeight: '800',
                marginBottom: '24px'
              }}>
                <div style={{
                  background: 'linear-gradient(135deg, #4f46e5, #7c3aed)',
                  padding: '8px',
                  borderRadius: '12px',
                  display: 'flex'
                }}>
                  <GraduationCap size={24} color="white" />
                </div>
                <span className="gradient-text">TutorConnect</span>
              </div>
              <p style={{ color: '#94a3b8', lineHeight: '1.6', marginBottom: '24px' }}>
                Connecting students, teachers, and parents for better educational outcomes across India.
              </p>
              <div style={{ display: 'flex', gap: '12px' }}>
                {[
                  { Icon: Facebook, color: '#1877f2' },
                  { Icon: Twitter, color: '#1da1f2' },
                  { Icon: Instagram, color: '#e4405f' },
                  { Icon: Linkedin, color: '#0a66c2' }
                ].map(({ Icon, color }, i) => (
                  <a
                    key={i}
                    href="#"
                    className="hover-lift"
                    style={{
                      background: 'rgba(255,255,255,0.05)',
                      color: color,
                      padding: '12px',
                      borderRadius: '12px',
                      display: 'flex',
                      border: '1px solid rgba(255,255,255,0.1)'
                    }}
                  >
                    <Icon size={18} />
                  </a>
                ))}
              </div>
            </div>

            <div>
              <h4 style={{ color: 'white', marginBottom: '24px', fontWeight: '700' }}>Quick Links</h4>
              <ul style={{ listStyle: 'none', padding: 0 }}>
                {['Home', 'How It Works', 'Notice Board', 'Login'].map((link, i) => (
                  <li key={link} style={{ marginBottom: '12px', animationDelay: `${i * 0.1}s` }} className="slide-in-left">
                    <a
                      href={link === 'Home' ? '#' : `#${link.toLowerCase().replace(/ /g, '-')}`}
                      style={{
                        color: '#94a3b8',
                        textDecoration: 'none',
                        transition: 'all 0.3s ease',
                        display: 'inline-flex',
                        alignItems: 'center',
                        gap: '8px'
                      }}
                      onMouseOver={(e) => { e.target.style.color = '#4f46e5'; e.target.style.transform = 'translateX(8px)'; }}
                      onMouseOut={(e) => { e.target.style.color = '#94a3b8'; e.target.style.transform = 'translateX(0)'; }}
                    >
                      <ArrowRight size={14} /> {link}
                    </a>
                  </li>
                ))}
              </ul>
            </div>

            <div>
              <h4 style={{ color: 'white', marginBottom: '24px', fontWeight: '700' }}>For Users</h4>
              <ul style={{ listStyle: 'none', padding: 0 }}>
                {['Student Registration', 'Teacher Registration', 'Parent Registration', 'Help Center'].map((link, i) => (
                  <li key={link} style={{ marginBottom: '12px', animationDelay: `${i * 0.1}s` }} className="slide-in-left">
                    <Link
                      to="/login"
                      style={{
                        color: '#94a3b8',
                        textDecoration: 'none',
                        transition: 'all 0.3s ease',
                        display: 'inline-flex',
                        alignItems: 'center',
                        gap: '8px'
                      }}
                      onMouseOver={(e) => { e.target.style.color = '#4f46e5'; e.target.style.transform = 'translateX(8px)'; }}
                      onMouseOut={(e) => { e.target.style.color = '#94a3b8'; e.target.style.transform = 'translateX(0)'; }}
                    >
                      <ArrowRight size={14} /> {link}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>

            <div>
              <h4 style={{ color: 'white', marginBottom: '24px', fontWeight: '700' }}>Contact Info</h4>
              <ul style={{ listStyle: 'none', padding: 0 }}>
                <li style={{ display: 'flex', gap: '12px', color: '#94a3b8', marginBottom: '16px', alignItems: 'flex-start' }}>
                  <Mail size={18} color="#4f46e5" style={{ marginTop: '2px' }} />
                  <span>support@tutorconnect.in</span>
                </li>
                <li style={{ display: 'flex', gap: '12px', color: '#94a3b8', marginBottom: '16px', alignItems: 'flex-start' }}>
                  <Phone size={18} color="#10b981" style={{ marginTop: '2px' }} />
                  <span>+91 98765 43210</span>
                </li>
                <li style={{ display: 'flex', gap: '12px', color: '#94a3b8', marginBottom: '16px', alignItems: 'flex-start' }}>
                  <MapPin size={18} color="#f59e0b" style={{ marginTop: '2px' }} />
                  <span>42, Education Market, Near City Center, Mumbai, Maharashtra 400001</span>
                </li>
              </ul>
            </div>
          </div>

          <div style={{
            paddingTop: '40px',
            borderTop: '1px solid rgba(255,255,255,0.05)',
            textAlign: 'center',
            color: '#64748b',
            fontSize: '0.9rem',
            display: 'flex',
            justifyContent: 'center',
            alignItems: 'center',
            gap: '20px',
            flexWrap: 'wrap'
          }}>
            <span>© 2026 TutorConnect. All Rights Reserved.</span>
            <span style={{ color: '#4f46e5' }}>Made with <Heart size={14} style={{ display: 'inline', marginBottom: '-2px' }} /> in India</span>
          </div>
        </div>
      </footer>
      
      {/* AI ChatBot Feature */}
      <ChatBot />
    </div>
  );
}
