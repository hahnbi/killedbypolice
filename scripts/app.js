var app = {};

app.filteredData = {};

app.filters = ['ageGroup', 
               'race', 
               'gender',
               'region', 
               'cause', 
               'armed', 
               'suspension',
               'priors'];

app.categories = {
  ageGroup: ['15-24', '25-34', '35-44', '45-54', '55-64', '65+'],
  race: ['Asian / Pacific Islander', 'Black', 'Latino', 'Native American', 'White', 'Unknown'],
  gender: ['Male', 'Female'],
  region: ['Northeast', 'Midwest', 'South', 'West'],
  cause: ['Physical confrontation', 'Shooting', 'Struck by vehicle', 'Taser gun', 'Other'],
  armed: ['Yes', 'No', 'Unclear'],
  suspension: ['Yes', 'No', 'Unclear'],
  priors: ['Yes', 'No', 'Unclear']
};

app.filterQuestions = {
  ageGroup: 'How old was the victim?', 
  race: 'What race was the victim?', 
  gender: 'What gender was the victim?',
  region: 'Where did the incident occur?', 
  cause: 'What was the cause of death?', 
  armed: 'Was the victim armed?',
  suspension: 'Was the officer suspended?',
  priors: 'Did the victim have any priors?'
};

app.stateRegions = {
  Northeast: ['Connecticut', 'Maine', 'Massachusetts', 
              'New Hampshire', 'Rhode Island', 'Vermont', 
              'New Jersey', 'New York', 'Pennsylvania'],
  Midwest:   ['Illinois', 'Indiana', 'Michigan', 'Ohio', 
              'Wisconsin', 'Iowa', 'Kansas', 'Minnesota', 
              'Missouri', 'Nebraska', 'North Dakota', 
              'South Dakota'],
  South:     ['Delaware', 'Florida', 'Georgia', 'Maryland', 
              'North Carolina', 'South Carolina', 
              'Virginia', 'Washington D.C.', 'West Virginia', 
              'Alabama', 'Kentucky', 'Mississippi',
              'Tennessee', 'Arkansas', 'Louisiana', 
              'Oklahoma', 'Texas'],
  West:      ['Arizona', 'Colorado', 'Idaho', 'Montana',
              'Nevada', 'New Mexico', 'Utah', 'Wyoming',
              'Alaska', 'California', 'Hawaii', 'Oregon',
              'Washington']
};

app.personCardTemplate = _.template('<ul>' + 
      '<li><span class="person-card-header">Name:</span> <%= name %></li>' + 
      '<li><span class="person-card-header">Age:</span> <%= age %></li>' + 
      '<li><span class="person-card-header">Race:</span> <%= race %></li>' + 
      '<li><span class="person-card-header">Gender:</span> <%= gender %></li>' + 
      '<li><span class="person-card-header">Location:</span> <%= city %>, <%= state%></li>' + 
      '<li><span class="person-card-header">Cause of death:</span> <%= cause %></li>' + 
      '<li><span class="person-card-header">Armed:</span> <%= armed %></li>' + 
      '<li><span class="person-card-header">Officer suspension:</span> <%= suspension %></li>' + 
      '<li><span class="person-card-header">Priors:</span> <%= priors %></li>' + 
    '</ul>')

app.filterData = function(filter) {
  app.filteredData = {};

  // filter data
  _.each(app.categories[filter], function(c) {
    app.filteredData[c] = [];
  })
  _.each(app.data, function(d) {
    app.filteredData[d[filter]].push(d);
  });

  // bind data for main columns
  var categories = d3.select('.content-main').selectAll('div.filter-category').data(app.categories[filter]);
  var categoriesEnter = categories.enter().append('div').classed('filter-category', true).style('opacity', 0);
  
  categoriesEnter.on('mouseleave', function() {app.hidePersonCard();})
  categoriesEnter.append('h4');
  categoriesEnter.append('div').classed('person-dots', true);
  categoriesEnter.append('h5').classed('filter-total', true);
  d3.transition().duration(400).each(function() {
    categories.select('h5')
      .transition().duration(0)
        .style('opacity', 0);
  })
    .each('end', function() {
      categories.select('h4').text(function(d) { return d; })
      categories.select('h5').text(function(d) { return app.filteredData[d].length; })
        .transition()
          .duration(250)
          .style('opacity', 1)
          .delay(500);
    });

  categories.transition().duration(500).style('opacity', 1);
  categories.exit()
    .transition()
      .duration(500)
      .style('opacity', 0)
    .each('end', function() {
      categories.exit().remove();
    });

  _.each(app.categories[filter], function(f, i) {
    var cls = filter === 'ageGroup' ? 'ageGroup' + f.replace(/[^\w]|_/g, "") : f.replace(/[^\w]|_/g, "");
    $($('.filter-category')[i]).attr('id', cls);
  })

  // bind data for people
  _.each(app.categories[filter], function(col) { 
    var cls = filter === 'ageGroup' ? 'ageGroup' + col.replace(/[^\w]|_/g, "") : col.replace(/[^\w]|_/g, "");
    var people = d3.select('#' + cls + ' > .person-dots').selectAll('div').data(app.filteredData[col]);
    var peopleEnter = people.enter().append('div').classed('person-dot', true).style('opacity', 0)
    peopleEnter
      .transition()
        .duration(500)
        .style('opacity', 1)
        .delay(function(d, i) { return i; });
    peopleEnter
      .on('mouseover', function(d) {
        d3.select(this).classed('person-dot-active', true);
        app.showPersonCard(d);
      })
      .on('mouseleave', function() {
        d3.select(this).classed('person-dot-active', false);
      });
    people.exit()
      .transition()
        .duration(500)
        .style('opacity', 0)
        .delay(function(d, i) { 
          return (people.exit()[0].length - i); 
        })
      .each('end', function() {
        this.remove();
      });
  });

};

app.loadContentHeader = function(filter) {
  $('.content-header > h2').text(app.filterQuestions[filter]);
};

// load and preprocess data
app.loadData = function() {
  d3.csv('rawdata.csv', function(data) {
    app.data = data;

    // add ageGroup and region for each person
    _.each(data, function(d) {
      // add ageGroup
      if (d.age <= 24) {
        d.ageGroup = '15-24';
      } else if (d.age <= 34) {
        d.ageGroup = '25-34';
      } else if (d.age <= 44) {
        d.ageGroup = '35-44';
      } else if (d.age <= 54) {
        d.ageGroup = '45-54';
      } else if (d.age <= 64) {
        d.ageGroup = '55-64';
      } else if (d.age <= 200) {
        d.ageGroup = '65+';
      } else {
        d.ageGroup = 'undefined';
      }

      // add region
      _.each(app.stateRegions, function (states, region) {
        if (states.indexOf(d.state) !== -1) {
          d.region = region;
        }
      });
    });
  })
};

app.loadFilterHandlers = function() {
  $('.filter').on('click', '.filter-item', function(e) {
    app.filterData($(this).data('filter'));
    app.loadContentHeader($(this).data('filter'));
    app.makeActive($(this));
  })
}

// assign filter data to links
app.loadLinks = function() {
  var $links = $('.filter-item');
  _.each($links, function(link, i) {
    $(link).data("filter", app.filters[i]);
  });
};

app.makeActive = function($activeLink) {
  var $links = $('.filter-item');
  _.each($links, function(link) {
    $(link).removeClass('filter-item-active');
  })
  $activeLink.addClass('filter-item-active');
}

app.hidePersonCard = function() {
  $('.person-card').hide();
}

app.showPersonCard = function(data) {
  $('.person-card').html(app.personCardTemplate(data));
  $('.person-card').show();
};

$(document).ready(function() {

    app.loadLinks();
    app.loadData();
    app.loadFilterHandlers();
  
})
