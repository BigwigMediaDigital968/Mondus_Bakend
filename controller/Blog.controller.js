const BlogPost = require("../models/Blog.model");

exports.newBlogPost = async (req, res) => {
  try {
    const { title, slug, excerpt, content, author, coverImageAlt, tags } =
      req.body;

    let faqs = [];
    if (req.body.faqs) {
      try {
        faqs =
          typeof req.body.faqs === "string"
            ? JSON.parse(req.body.faqs)
            : req.body.faqs;
      } catch (err) {
        return res.status(400).json({ error: "Invalid FAQs format." });
      }
    }

    if (!req.file || (!req.file.path && !req.file.secure_url)) {
      return res.status(400).json({ error: "Cover image is required." });
    }

    const coverImage = req.file.secure_url || req.file.path;

    const blogPost = new BlogPost({
      title,
      slug,
      excerpt,
      content,
      author,
      coverImageAlt,
      tags,
      coverImage,
      faqs,
    });

    await blogPost.save();

    return res.status(201).json({
      message: "Blog post created successfully.",
      blogPost,
    });
  } catch (error) {
    console.error("Error creating blog post:", error);
    return res.status(500).json({ error: "Internal server error." });
  }
};

exports.getBlog = async (req, res) => {
  try {
    const blogs = await BlogPost.find()
      .sort({ lastUpdated: -1, datePublished: -1 }) // ✅ latest first
      .lean();

    // ✅ Always return 200 (better API practice)
    res.status(200).json({
      count: blogs.length,
      data: blogs,
    });
  } catch (error) {
    console.error("Error fetching blogs:", error);
    res.status(500).json({ msg: "Server Error" });
  }
};

// exports.updateBlogPostBySlug = async (req, res) => {
//   const { slug } = req.params;
//   const { title, content, author, coverImageAlt, excerpt, tags } = req.body;

//   try {
//     // ✅ Parse FAQs safely
//     let faqs;
//     if (req.body.faqs) {
//       try {
//         faqs =
//           typeof req.body.faqs === "string"
//             ? JSON.parse(req.body.faqs)
//             : req.body.faqs;
//       } catch (err) {
//         return res.status(400).json({ error: "Invalid FAQs format." });
//       }
//     }

//     const updateFields = {
//       ...(title && { title }),
//       ...(content && { content }),
//       ...(author && { author }),
//       ...(excerpt && { excerpt }),
//       ...(coverImageAlt && { coverImageAlt }),
//       ...(tags && { tags }),
//       ...(faqs && { faqs }), // ✅ Add FAQs update
//       lastUpdated: new Date(),
//     };

//     // ✅ Handle cover image update
//     if (req.file && (req.file.secure_url || req.file.path)) {
//       updateFields.coverImage = req.file.secure_url || req.file.path;
//     }

//     const updatedBlogPost = await BlogPost.findOneAndUpdate(
//       { slug },
//       updateFields,
//       { new: true, runValidators: true },
//     );

//     if (!updatedBlogPost) {
//       return res.status(404).json({ msg: "Blog post not found" });
//     }

//     res.status(200).json({
//       msg: "Blog post updated successfully",
//       blogPost: updatedBlogPost,
//     });
//   } catch (error) {
//     console.error("Update error:", error.message);
//     res.status(500).json({ msg: "Server Error" });
//   }
// };

exports.updateBlogPostBySlug = async (req, res) => {
  const { slug } = req.params;
  const { slug: newSlug } = req.body;

  try {
    const blog = await BlogPost.findOne({ slug });

    if (!blog) {
      return res.status(404).json({ msg: "Blog post not found" });
    }

    // ✅ Handle slug change
    if (newSlug && newSlug !== slug) {
      // Check duplicate
      const existing = await BlogPost.findOne({ slug: newSlug });
      if (existing) {
        return res.status(400).json({
          error: "Slug already exists",
        });
      }

      // ✅ Save old slug in history
      blog.slugHistory = blog.slugHistory || [];

      if (!blog.slugHistory.includes(slug)) {
        blog.slugHistory.push(slug);
      }

      blog.slug = newSlug;
    }

    // 👉 Update other fields (same as before)
    blog.title = req.body.title || blog.title;
    blog.content = req.body.content || blog.content;
    blog.author = req.body.author || blog.author;
    blog.excerpt = req.body.excerpt || blog.excerpt;
    blog.tags = req.body.tags || blog.tags;

    // FAQs
    if (req.body.faqs) {
      blog.faqs =
        typeof req.body.faqs === "string"
          ? JSON.parse(req.body.faqs)
          : req.body.faqs;
    }

    blog.lastUpdated = new Date();

    // Image update
    if (req.file && (req.file.secure_url || req.file.path)) {
      blog.coverImage = req.file.secure_url || req.file.path;
    }

    if (req.body.removeImage === "true") {
      blog.coverImage = null;
    }

    await blog.save();

    res.status(200).json({
      msg: "Blog updated successfully",
      blogPost: blog,
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ msg: "Server Error" });
  }
};

exports.deleteBlogPostBySlug = async (req, res) => {
  const { slug } = req.params;

  try {
    const deletedBlogPost = await BlogPost.findOneAndDelete({ slug });

    if (!deletedBlogPost) {
      return res.status(404).json({ msg: "Blog post not found" });
    }

    res.status(200).json({ msg: "Blog post deleted successfully" });
  } catch (error) {
    console.error("Delete error:", error.message);
    res.status(500).json({ msg: "Server Error" });
  }
};

// ── ADD THIS to your Blog.controller.js ────────────────────────────────────

exports.getBlogBySlug = async (req, res) => {
  const { slug } = req.params;

  try {
    // 1. Try exact slug match first
    let blog = await BlogPost.findOne({ slug }).lean();

    // 2. If not found, check slugHistory for old slugs (redirect support)
    if (!blog) {
      const oldBlog = await BlogPost.findOne({ slugHistory: slug }).lean();

      if (oldBlog) {
        // Tell the frontend to redirect to the new canonical slug
        return res.status(200).json({
          redirect: true,
          newSlug: oldBlog.slug,
        });
      }

      return res.status(404).json({ msg: "Blog post not found" });
    }

    return res.status(200).json({ blog });
  } catch (error) {
    console.error("Error fetching blog by slug:", error.message);
    return res.status(500).json({ msg: "Server Error" });
  }
};
