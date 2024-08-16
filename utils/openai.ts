import axios from "axios"

// Only include models that support the `json` response format.
export enum Model {
  GPT_3_5_TURBO = "GPT-3.5 Turbo",
  GPT_4O = "GPT-4o",
  GPT_4O_MINI = "GPT-4o mini",
  GPT_4_TURBO = "GPT-4 Turbo",
}

const modelName = (model: Model) => {
  switch (model) {
    case Model.GPT_3_5_TURBO: {
      return "gpt-3.5-turbo"
    }
    case Model.GPT_4O: {
      return "gpt-4o"
    }
    case Model.GPT_4O_MINI: {
      return "gpt-4o-mini"
    }
    case Model.GPT_4_TURBO: {
      return "gpt-4-turbo"
    }
    default: {
      const _exhaustivenessCheck: never = model
      break
    }
  }
}

export const chatCompletion = async ({
  model,
  openAIKey,
  systemPrompt,
  userPrompt,
  ...rest
}: {
  model: Model
  openAIKey: string
  systemPrompt: string
  userPrompt: string
} & { [key: string]: any }) => {
  console.log(modelName(model))
  return axios.post(
    `https://api.openai.com/v1/chat/completions`,
    {
      model: modelName(model),
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
        Authorization: `Bearer ${openAIKey}`,
      },
    }
  )
}
