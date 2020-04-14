using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading.Tasks;

namespace Jeffpardy
{
    public class GameRound
    {
        public int Id { get; set; }

        public Category[] Categories { get; set; }
    }

    public class GameData
    {
        public GameRound[] Rounds { get; set;  } 
    }
}
