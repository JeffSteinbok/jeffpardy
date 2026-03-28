using System.Collections.Generic;

namespace Jeffpardy
{
    public class FinalJeffpardyTeamSettings
    {
        public int MaxWagerAmount { get; set; }
    }

    public class FinalJeffpardySettings
    {
        public Dictionary<string, FinalJeffpardyTeamSettings> TeamSettings { get; set; }
    }
}
