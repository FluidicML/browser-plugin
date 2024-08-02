import axios from "axios"

export const chatCompletion = async ({
  openaiApiKey,
  systemPrompt,
  userPrompt,
  ...rest
}: {
  openaiApiKey: string
  systemPrompt: string
  userPrompt: string
} & { [key: string]: any }) => {
  return axios.post(
    `https://api.openai.com/v1/chat/completions`,
    {
      model: "gpt-4o",
      messages: [
        {
          role: "system",
          content: systemPrompt,
        },
        {
          role: "user",
          content: userPrompt,
        },
      ],
      ...rest,
    },
    {
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${openaiApiKey}`,
      },
    }
  )
}
