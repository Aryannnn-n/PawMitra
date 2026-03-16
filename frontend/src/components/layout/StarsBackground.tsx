import { useEffect, useState } from 'react';

// Generates a random box-shadow string of coordinates to act as stars
const generateStars = (n: number) => {
  let value = `${Math.floor(Math.random() * 2000)}px ${Math.floor(Math.random() * 2000)}px #FFF`;
  for (let i = 2; i <= n; i++) {
    // Add glowing opacity and random sizes through colors
    const opacity = Math.random() > 0.5 ? '0.8' : '0.4';
    value += `, ${Math.floor(Math.random() * 2000)}px ${Math.floor(
      Math.random() * 2000
    )}px rgba(255,255,255,${opacity})`;
  }
  return value;
};

// Generate once globally so they don't jump around on re-renders
const starsSmall = generateStars(700);
const starsMedium = generateStars(200);
const starsLarge = generateStars(100);

export const StarsBackground = () => {
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) return null;

  return (
    <div className="fixed inset-0 z-[0] hidden dark:block bg-black overflow-hidden pointer-events-none">
      <div id="stars" />
      <div id="stars2" />
      <div id="stars3" />
      
      <style>{`
        @keyframes animStar {
          from { transform: translateY(0px); }
          to { transform: translateY(-2000px); }
        }

        #stars {
          width: 1px;
          height: 1px;
          background: transparent;
          box-shadow: ${starsSmall};
          animation: animStar 50s linear infinite;
        }
        #stars:after {
          content: " ";
          position: absolute;
          top: 2000px;
          width: 1px;
          height: 1px;
          background: transparent;
          box-shadow: ${generateStars(700)}; /* second layer to loop smoothly */
        }

        #stars2 {
          width: 2px;
          height: 2px;
          background: transparent;
          box-shadow: ${starsMedium};
          animation: animStar 100s linear infinite;
        }
        #stars2:after {
          content: " ";
          position: absolute;
          top: 2000px;
          width: 2px;
          height: 2px;
          background: transparent;
          box-shadow: ${generateStars(200)};
        }

        #stars3 {
          width: 3px;
          height: 3px;
          background: transparent;
          box-shadow: ${starsLarge};
          animation: animStar 150s linear infinite;
        }
        #stars3:after {
          content: " ";
          position: absolute;
          top: 2000px;
          width: 3px;
          height: 3px;
          background: transparent;
          box-shadow: ${generateStars(100)};
        }
      `}</style>
    </div>
  );
};
