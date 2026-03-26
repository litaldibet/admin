const url = import.meta.env.VITE_SUPABASE_URL

export const createPost:string = `${url}/functions/v1/create_post`
export const deletePost:string = `${url}/functions/v1/delete_post`
export const updatePost:string = `${url}/functions/v1/update_post`
export const loadPost  :string = `${url}/functions/v1/load_post`
export const loadCards :string = `${url}/functions/v1/load_cards`

