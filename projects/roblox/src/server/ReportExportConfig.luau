--!strict
local ServerStorage = game:GetService("ServerStorage")

export type ExportConfig = {
	baseUrl: string,
	ingestSecret: string,
}

local ReportExportConfig = {}

function ReportExportConfig.load(): ExportConfig?
	local settings = ServerStorage:FindFirstChild("ReportExportSettings")
	local url: any = settings and settings:GetAttribute("BackendBaseUrl")
	local secret: any = settings and settings:GetAttribute("IngestSecret")

	if typeof(url) ~= "string" or typeof(secret) ~= "string" then
		return nil
	end

	url = string.gsub(url, "/+$", "")
	if not string.match(url, "^https://") then
		return nil
	end

	if string.len(secret) == 0 then
		return nil
	end

	return {
		baseUrl = url,
		ingestSecret = secret,
	}
end

return ReportExportConfig
