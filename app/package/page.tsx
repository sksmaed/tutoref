'use client'

import React from 'react';
import { ExternalLink } from 'lucide-react';
import { packages } from '../../types/package'
import PackageMediumArticles from '../../components/layout/packageMediumArticle'
import HeaderMenu from '../../components/layout/headerMenu';

const PackagePage = () => {

  return (
    <div className="min-h-screen bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
      <HeaderMenu />
      
      <div className="max-w-7xl mx-auto">
        <h1 className="text-3xl font-bold text-center text-gray-900 mb-12">
          Package a.k.a 教案撰寫資源大補帖
        </h1>

        {/* Medium Articles Section */}
        <PackageMediumArticles />

        <h2 className="my-6 text-2xl font-bold text-gray-900 mb-8">
            其他資源
        </h2>

        <div className="grid md:grid-cols-3 gap-8">
          {packages.map((pkg, index) => (
            <div 
              key={index}
              className="bg-white rounded-lg shadow-md overflow-hidden hover:shadow-lg transition-shadow duration-300"
            >
              <div className="p-6">
                <h2 className="text-xl font-semibold text-gray-900 mb-2">
                  {pkg.title}
                </h2>
                <p className="text-gray-600 mb-4">
                  {pkg.description}
                </p>
                <ul className="space-y-3">
                  {pkg.links.map((link, linkIndex) => (
                    <li key={linkIndex}>
                      <div className="flex items-center">
                        <a
                          href={link.url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="inline-flex items-center text-blue-600 hover:text-blue-800 transition-colors duration-200"
                        >
                          <ExternalLink size={16} className="mr-2 flex-shrink-0" />
                          <span>{link.name}</span>
                        </a>
                      </div>
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default PackagePage;