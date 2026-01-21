import React from 'react';

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'danger';
  size?: 'sm' | 'md' | 'lg';
}

export function Button({ 
  children, 
  variant = 'primary', 
  size = 'md', 
  className = '', 
  ...props 
}: ButtonProps) {
  const baseStyles = 'font-bold uppercase tracking-wider transition-colors duration-200 disabled:opacity-50 disabled:cursor-not-allowed border-2 focus:outline-none focus:ring-0';
  
  const variants = {
    primary: 'bg-black text-white border-black hover:bg-white hover:text-black',
    secondary: 'bg-white text-black border-black hover:bg-black hover:text-white',
    danger: 'bg-red-600 text-white border-red-600 hover:bg-white hover:text-red-600 hover:border-red-600'
  };
  
  const sizes = {
    sm: 'px-4 py-2 text-xs',
    md: 'px-6 py-3 text-sm',
    lg: 'px-8 py-4 text-base'
  };

  return (
    <button 
      className={`${baseStyles} ${variants[variant]} ${sizes[size]} ${className}`}
      {...props}
    >
      {children}
    </button>
  );
}
