--!strict
local ServerStorage = game:GetService("ServerStorage")

export type ExportConfig = {
	baseUrl: string,
	ingestSecret: string,
}

local DEFAULT_BASE_URL = "https://bezpieczna-aura.pl"
local DEFAULT_INGEST_SECRET = "bezpieczna-aura-roblox-2026"

local ReportExportConfig = {}

function ReportExportConfig.load(): ExportConfig?
	local settings = ServerStorage:FindFirstChild("ReportExportSettings")
	local url: any = settings and settings:GetAttribute("BackendBaseUrl")
	local secret: any = settings and settings:GetAttribute("IngestSecret")

	if typeof(url) ~= "string" or url == "" then
		url = DEFAULT_BASE_URL
	end
	if typeof(secret) ~= "string" or secret == "" then
		secret = DEFAULT_INGEST_SECRET
	end

	url = string.gsub(url, "/+$", "")
	if not string.match(url, "^https://") then
		warn("[ReportExportConfig] Ingest URL must use HTTPS: " .. tostring(url))
		return nil
	end

	if string.len(secret) == 0 then
		warn("[ReportExportConfig] IngestSecret cannot be empty")
		return nil
	end

	return {
		baseUrl = url,
		ingestSecret = secret,
	}
end

return ReportExportConfig
