const syntaxHighlight = require('@11ty/eleventy-plugin-syntaxhighlight');
const pluginRss = require('@11ty/eleventy-plugin-rss');
const timeToRead = require('eleventy-plugin-time-to-read');
const safeLinks = require('@sardine/eleventy-plugin-external-links');
const eleventySass = require("@11tyrocks/eleventy-plugin-sass-lightningcss");
const related = require("eleventy-plugin-related");
const markdownIt = require("markdown-it");
const markdownItAnchor = require("markdown-it-anchor");

module.exports = function (eleventyConfig) {
  const parseDate = (str) => {
    if (str instanceof Date) {
      return str;
    }
    return Date.parse(str);
  };

  const formatPart = (part, date) =>
  new Intl.DateTimeFormat("en", part).format(date);

  eleventyConfig.setNunjucksEnvironmentOptions({
    lstripBlocks: true,
    trimBlocks: true
  });

  eleventyConfig.setLibrary("md", markdownIt({ "html": true }).use(markdownItAnchor, { "level": 2 }));

  eleventyConfig.addPlugin(pluginRss);
  eleventyConfig.addPlugin(syntaxHighlight);
  eleventyConfig.addPlugin(timeToRead);
  eleventyConfig.addPlugin(safeLinks);
  eleventyConfig.addPlugin(eleventySass);

  eleventyConfig.addPassthroughCopy("static");

  eleventyConfig.addFilter("date_to_datetime", (obj) => {
    const date = parseDate(obj);
    return date.toISOString();
  });

  eleventyConfig.addFilter("date_formatted", (obj) => {
    const date = parseDate(obj);

    const month = formatPart({ month: "short" }, date);
    const day = formatPart({ day: "numeric" }, date);
    const year = formatPart({ year: "numeric" }, date);
    const hours = date.getUTCHours();
    const minutes = date.getUTCMinutes();

    if (hours != 0 && minutes != 0) {

      return `${month} ${day}, ${year} - ${hours}:${minutes} UTC`;
    }

    return `${month} ${day}, ${year}`;
  });

  eleventyConfig.addFilter('urlescape', str => {
    return str.split('/').map(part => encodeURI(part)).join('/')
  });

  eleventyConfig.addFilter("related", function(obj) {
    const post = this.ctx;
    const posts = this.ctx.collections.posts.map(post => post.data);

    const tagScore = (a, b) => {
      const total = a.tags.length + b.tags.length;
      const intersection = a.tags.filter(tag => b.tags.includes(tag)).length;
      return (intersection * 2) / total;
    }

    const results = related.related({
      serializer: (doc) => [doc.title, doc.description],
      weights: [10, 10],
    })(post, posts).map(result => {
      return {
        relative: result.relative + tagScore(post, result.document),
        document: result.document
      }
    });

    return results.filter(result => result.relative > 0.2).sort((a, b) => a.relative - b.relative).reverse().slice(0,3);
  });

  eleventyConfig.addCollection('posts', collection => {
    return collection.getFilteredByGlob('src/posts/*.md').reverse()
  });

  return {
    templateFormats: ["njk", "md", "html"],
    dir: {
      input: "_site",
      includes: "_includes",
      output: "docs",
    },
    markdownTemplateEngine: "njk",
    htmlTemplateEngine: "njk",
    dataTemplateEngine: "njk",
    passthroughFileCopy: false,
  };
};
