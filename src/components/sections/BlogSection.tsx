import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Link } from 'react-router-dom';
import fs from 'fs';
import path from 'path';
import matter from 'gray-matter';

interface Post {
  slug: string;
  title: string;
  date: string;
  excerpt: string;
}

function BlogSection() {
  const [posts, setPosts] = useState<Post[]>([]);
  const [currentPage, setCurrentPage] = useState(1);
  const [postsPerPage, setPostsPerPage] = useState(12);

  useEffect(() => {
    const handleResize = () => {
      setPostsPerPage(window.innerWidth <= 768 ? 6 : 12);
    };
    handleResize();
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  useEffect(() => {
    const postsDirectory = path.join(import.meta.env.BASE_URL, 'posts');
    const filenames = fs.readdirSync(postsDirectory);

    const blogPosts = filenames.map((filename) => {
      const filePath = path.join(postsDirectory, filename);
      const fileContents = fs.readFileSync(filePath, 'utf8');
      const { data } = matter(fileContents);

      return {
        slug: filename.replace(/\.md$/, ''),
        title: data.title,
        date: data.date,
        excerpt: data.excerpt,
      };
    });

    const sortedPosts = blogPosts.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
    setPosts(sortedPosts);
  }, []);

  const indexOfLastPost = currentPage * postsPerPage;
  const indexOfFirstPost = indexOfLastPost - postsPerPage;
  const currentPosts = posts.slice(indexOfFirstPost, indexOfLastPost);
  const totalPages = Math.ceil(posts.length / postsPerPage);

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="bg-[#1a2f5c]/50 rounded-2xl p-6 sm:p-8 md:p-12 w-full mx-auto"
    >
      <h2 className="text-3xl md:text-4xl font-bold bg-gradient-to-r from-white via-blue-200 to-blue-400 bg-clip-text text-transparent mb-8">
        Blog
      </h2>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {currentPosts.map((post) => (
          <Link key={post.slug} to={`/blog/${post.slug}`} className="bg-[#1a2f5c] rounded-xl p-6 shadow hover:shadow-xl transition">
            <h3 className="text-xl font-semibold text-blue-300 mb-2">{post.title}</h3>
            <p className="text-sm text-gray-400 mb-2">{new Date(post.date).toLocaleDateString()}</p>
            <p className="text-gray-300 text-sm">{post.excerpt}</p>
          </Link>
        ))}
      </div>

      {totalPages > 1 && (
        <div className="flex justify-center mt-8 gap-3">
          {[...Array(totalPages)].map((_, index) => (
            <button
              key={index + 1}
              onClick={() => setCurrentPage(index + 1)}
              className={`px-4 py-2 rounded-md font-medium ${
                currentPage === index + 1 ? 'bg-blue-500 text-white' : 'bg-[#1a2f5c] text-blue-300'
              }`}
            >
              {index + 1}
            </button>
          ))}
        </div>
      )}
    </motion.div>
  );
}

export default BlogSection;