using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading.Tasks;

namespace Jeffpardy
{
    public class FinalJeffpardyTeamSettings
    {
        public int MaxWagerAmount { get; set; }
    }

    public class FinalJeffpardySettings
    {
        public Dictionary<string, FinalJeffpardySettings> TeamSettings;
    }
}
