import { Pool, neonConfig } from "@neondatabase/serverless"
import ws from "ws"

// Bypass SSL verification for local dev DNS fix
process.env.NODE_TLS_REJECT_UNAUTHORIZED = '0'

neonConfig.webSocketConstructor = ws

const connectionString = "postgresql://neondb_owner:npg_4uws8vlyrCec@ep-polished-surf-a1ii39gu-pooler.ap-southeast-1.aws.neon.tech/neondb?sslmode=require&options=endpoint%3Dep-polished-surf-a1ii39gu-pooler"

// Bypass DNS resolution by routing the hostname to the IP directly
neonConfig.wsProxy = (host) => {
    if (host.includes("neon.tech")) {
        return "52.220.170.93:443/v2" // Direct WS endpoint on Neon
    }
    return `${host}/v2`
}

const pool = new Pool({
    connectionString,
    ssl: true // Standard SSL
})

export async function sql(strings: TemplateStringsArray, ...values: any[]) {
    const [query, params] = strings.reduce(
        ([str, args], segment, i) => {
            return [
                str + segment + (i < values.length ? `$${i + 1}` : ""),
                i < values.length ? [...args, values[i]] : args,
            ]
        },
        ["", []] as [string, any[]]
    )

    const { rows } = await pool.query(query, params)
    return rows
}
