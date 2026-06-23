export interface StatsBatch {
	id: number
	title: string
	start_date: string | null
	end_date: string | null
	student_ids: number[]
	student_newsletters: Record<string, string>
	global_newsletter: string
	created_at: string
}
