const url = import.meta.env.VITE_SUPABASE_URL

export const createPost = `${url}/functions/v1/create_post`
