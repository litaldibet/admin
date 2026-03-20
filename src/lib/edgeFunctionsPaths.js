const url = import.meta.env.VITE_SUPABASE_URL

export const createPost = `${url}/functions/v1/create_post`
export const deletePost = `${url}/functions/v1/delete_post`
export const updatePost = `${url}/functions/v1/update_post`
export const loadPost = `${url}/functions/v1/load_post`
