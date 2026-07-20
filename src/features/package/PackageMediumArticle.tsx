import React from 'react';
import { ArrowRight } from 'lucide-react';
import { articles } from '@/types/package';

const PackageMediumArticles = () => {
  return (
    <div className="py-12 px-4 my-6 sm:px-6 lg:px-8">
      <div className="max-w-7xl mx-auto">
        <h2 className="text-2xl font-bold text-gray-900 mb-8">
          Medium 系列文章：一份教案的誕生
        </h2>
        
        <div className="relative">
          {/* 連接點的線 */}
          <div className="absolute left-8 top-0 h-full w-0.5 bg-black-400 hidden md:block" />
          
          <div className="space-y-8">
            {articles.map((article, index) => (
              <a
                key={index}
                href={article.url}
                target="_blank"
                rel="noopener noreferrer"
                className="block"
              >
                <div className="relative flex items-start group">
                  {/* 序號圓圈 */}
                  <div className="shrink-0 w-16 h-16 rounded-full bg-primary-300 group-hover:bg-primary-700 flex items-center justify-center border-2 border-primary-600 z-10 transition-colors duration-200">
                    <span className="text-xl font-bold text-primary-600">
                      {article.number}
                    </span>
                  </div>

                  {/* 文章內容 */}
                  <div className="ml-6 flex-1">
                    <div className="bg-white group-hover:bg-primary-50 p-6 rounded-lg transition-colors duration-200 shadow-sm">
                      <h3 className="text-lg font-semibold text-gray-900 flex items-center">
                        {article.title}
                        <ArrowRight className="ml-2 opacity-0 group-hover:opacity-100 transition-opacity duration-200 text-primary-900" size={18} />
                      </h3>
                      <p className="mt-2 text-gray-600">{article.description}</p>
                      <div className="mt-2 text-sm text-gray-500">{article.readTime}</div>
                    </div>
                  </div>
                </div>
              </a>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

export default PackageMediumArticles;
